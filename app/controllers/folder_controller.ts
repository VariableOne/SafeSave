import { HttpContext } from "@adonisjs/core/http";
import db from "@adonisjs/lucid/services/db";

export default class FolderController{
  
    //Ordner anlegen
    public async createFolder({ request, view, session }: HttpContext) {

        const folderName = request.input("folderName");
        const student = session.get('student');
        const parentFolderId = request.input("folderId"); 
        console.log(parentFolderId);

        // Neuen Ordner in die Datenbank einfügen
        await db.table('folder').insert({
            folder_name: folderName,
            student_id: student.student_id,
            parent_folder_id: parentFolderId || null
        });

        // Alle Ordner des Studenten abrufen
        const folders = await db.from('folder').select('*').where('student_id', student.student_id);

        // Alle Dateien des Studenten abrufen
        const files = await db.from('file').select('*').where('student_id', student.student_id);

        return view.render('pages/home', {parentFolderId, folders: folders || [], files: files || [] });
        }

    //Ordner öffnen
    public async getFolder({ view, request, session }: HttpContext){

        const folderId = request.input('folderId')
        const files = await db.from('file').where('folder_id', folderId).andWhere('student_id', session.get('student').student_id).select('*');
        console.log(folderId);
        console.log(session.get('student').student_id);

        const subfolders = await db.from('folder').where('parent_folder_id', folderId).andWhere('student_id', session.get('student').student_id).select('*');

        return view.render('pages/insideTheFolder', { folderId, files: files || [], subfolders: subfolders || [] });
    }

     //Ordner umbenennen
    public async renameFolder({request, session, response, view}:HttpContext){
        
        const folderId = request.input('folderToRename');
        const newFolderName = request.input('newFolderName');
        const studentId = session.get('student').student_id;
        
        const folderRecord = await db.from('folder').where('folder_id', folderId).andWhere('student_id', studentId).first();
        
        if (!folderRecord) {
            return response.status(404).send('Folder not found');
        }
        
        await db.from('folder').where('folder_id', folderId).andWhere('student_id', studentId).update({
            folder_name: newFolderName
        });
        
        const files = await db.from('file').select('*').where('student_id', studentId);
        const folders = await db.from('folder').select('*').where('student_id', studentId);
        
        return view.render('pages/home', { files, folders });

    }

     //Ordner löschen
    public async deleteFolder({ view,response, request, session }: HttpContext) {
        const folderId = request.input('folderId');
    
        // Zuerst den Ordner aus der Datenbank abrufen
        const folder = await db
            .from('folder')
            .where('folder_id', folderId)
            .andWhere('student_id', session.get('student').student_id)
            .first();
    
            console.log(folderId);
        if (!folder) {
            return response.status(404).json({ message: 'Folder not found' });
        }

        const relatedFolders = await db
        .from('folder')
        .select('folder_id')
        .where('parent_folder_id', folderId)
        .andWhere('student_id', session.get('student').student_id);

        // Erstelle eine Liste aller betroffenen Ordner-IDs (folderId und alle verwandten Ordner)
        const folderIdsToDelete = [folderId, ...relatedFolders.map((folder: { folder_id: number }) => folder.folder_id)];
        try {
            // 1. Zuerst alle Dateien löschen, die mit den zu löschenden Ordnern verbunden sind
            await db
                .from('file')
                .whereIn('folder_id', folderIdsToDelete)
                .andWhere('student_id', session.get('student').student_id)
                .delete();
        
            // 2. Danach alle untergeordneten Ordner löschen, deren parent_folder_id einer der zu löschenden folder_ids ist
            await db
                .from('folder')
                .whereIn('parent_folder_id', folderIdsToDelete)
                .andWhere('student_id', session.get('student').student_id)
                .delete();
        
            // 3. Schließlich die Hauptordner selbst löschen
            await db
                .from('folder')
                .whereIn('folder_id', folderIdsToDelete)
                .andWhere('student_id', session.get('student').student_id)
                .delete();
        
        } catch (error) {
            console.error('Error during folder deletion:', error);
            throw new Error('Could not delete folders due to foreign key constraint violation.');
        }
          // Alle Ordner des Studenten abrufen
          const folders = await db.from('folder').select('*').where('student_id', session.get('student').student_id);

          // Alle Dateien des Studenten abrufen
          const files = await db.from('file').select('*').where('student_id', session.get('student').student_id);
        // Prüfen, ob der Ordner eine parent_folder_id hat
        //await this.deleteFolderAndContents(folderId, studentId);
        return view.render('pages/home', {folders, files});
    }
    
    //Funktion, die dann auch die Unterordner iterativ löscht
    private async deleteFolderAndContents(folderId: number, studentId: number) {
        // Rekursive Abfrage, um alle Unterordner zu finden
        const result = await db.rawQuery(`
            WITH RECURSIVE FolderHierarchy AS (
                SELECT folder_id
                FROM folder
                WHERE folder_id = ?
        
                UNION ALL
        
                SELECT f.folder_id
                FROM folder f
                INNER JOIN FolderHierarchy fh ON f.parent_folder_id = fh.folder_id
            )
            SELECT folder_id FROM FolderHierarchy;
        `, [folderId]);
        
        // Überprüfen, ob das Ergebnis ein Array ist und die Struktur der Daten
        const foldersToDelete = Array.isArray(result) ? result : result[0];
        
        // Überprüfen, ob die Daten extrahiert werden können
        const folderIds = foldersToDelete.map((row: { folder_id: number }) => row.folder_id);
        
        // Falls Ordner existieren, die gelöscht werden müssen
        if (folderIds.length > 0) {
            // Zuerst alle Dateien in den gefundenen Ordnern und Unterordnern löschen
            await db
                .from('file')
                .whereIn('folder_id', folderIds)
                .andWhere('student_id', studentId)
                .delete();
        
            // Dann die Ordner selbst löschen, beginnend mit den untersten (rekursive Reihenfolge beachten)
            await db
                .from('folder')
                .whereIn('folder_id', folderIds)
                .andWhere('student_id', studentId)
                .delete();
        }
    }
    
}
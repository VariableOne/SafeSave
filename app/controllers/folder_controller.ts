import { HttpContext } from "@adonisjs/core/http";
import db from "@adonisjs/lucid/services/db";

export default class FolderController{
  
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

        // View rendern und sicherstellen, dass `folders` und `files` immer Arrays sind
        return view.render('pages/home', {parentFolderId, folders: folders || [], files: files || [] });
        }

    public async getFolder({ view, request, session }: HttpContext){

        const folderId = request.input('folderId')
        const files = await db.from('file').where('folder_id', folderId).andWhere('student_id', session.get('student').student_id).select('*');
        console.log(folderId);
        console.log(session.get('student').student_id);

        const subfolders = await db.from('folder').where('parent_folder_id', folderId).andWhere('student_id', session.get('student').student_id).select('*');

        return view.render('pages/insideTheFolder', { folderId, files: files || [], subfolders: subfolders || [] });
    }

    public async deleteFolder({ view,response, request, session }: HttpContext) {
        const folderId = request.input('folderId');
    
        // Zuerst den Ordner aus der Datenbank abrufen
        const folder = await db
            .from('folder')
            .where('folder_id', folderId)
            .first();
    
            console.log(folderId);
        if (!folder) {
            return response.status(404).json({ message: 'Folder not found' });
        }
          // Alle Ordner des Studenten abrufen
          const folders = await db.from('folder').select('*').where('student_id', session.get('student').student_id);

          // Alle Dateien des Studenten abrufen
          const files = await db.from('file').select('*').where('student_id', session.get('student').student_id);
        // Prüfen, ob der Ordner eine parent_folder_id hat
        await this.deleteFolderAndContents(folderId);
        return view.render('pages/home', {folders: folders || [], files: files || [] });
    }
    
    private async deleteFolderAndContents(folderId: number) {
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
                .delete();
    
            // Dann die Ordner selbst löschen, beginnend mit den untersten
            for (const id of folderIds.reverse()) {
                await db
                    .from('folder')
                    .where('folder_id', id)
                    .delete();
            }
        }
    }
    
}
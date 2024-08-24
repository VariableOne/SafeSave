import { HttpContext } from "@adonisjs/core/http";
import hash from "@adonisjs/core/services/hash";
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
        const currentPath = request.url();
        return view.render('pages/home', {currentPath,parentFolderId, folders: folders || [], files: files || [] });
        }

    //Ordner öffnen
    public async getFolder({ view, request, session }: HttpContext){

        const folderId = request.input('folderId')
        const files = await db.from('file').where('folder_id', folderId).andWhere('student_id', session.get('student').student_id).select('*');
        console.log(folderId);
        console.log(session.get('student').student_id);

        const subfolders = await db.from('folder').where('parent_folder_id', folderId).andWhere('student_id', session.get('student').student_id).select('*');
        const currentPath = request.url();
        return view.render('pages/insideTheFolder', {currentPath, folderId, files: files || [], subfolders: subfolders || [] });
    }

     //Ordner umbenennen
    public async renameFolder({request, session, view}:HttpContext){
        const currentPath = request.url();
        const folderId = request.input('folderToRename');
        const newFolderName = request.input('newFolderName');
        const studentId = session.get('student').student_id;
        const files = await db.from('file').select('*').where('student_id', studentId);
        const folders = await db.from('folder').select('*').where('student_id', studentId);

        const folderRecord = await db.from('folder').where('folder_id', folderId).andWhere('student_id', studentId).first();
        
        if (!folderRecord) {
            return view.render('pages/home', { currentPath,files,folders, error: 'Ordner konnte nicht gefunden werden.' });
        }
        
        await db.from('folder').where('folder_id', folderId).andWhere('student_id', studentId).update({
            folder_name: newFolderName
        });
        
        return view.render('pages/home', { currentPath,files, folders });

    }

     //Ordner löschen
    public async deleteFolder({ view,response, request, session }: HttpContext) {
        const currentPath = request.url();
        const folderId = request.input('folderId');
        const password = request.input('password');
        const student = session.get('student');
        const result = await db.from('student').select('*').where('student_id', student.student_id).first();
        const checkPassword = await hash.verify(result.password, password);

    if (!checkPassword) {
        const files = await db.from('file').select('*').where('student_id', student.student_id);
        const folders = await db.from('folder').select('*').where('student_id', student.student_id);
        return view.render('pages/home', { currentPath,files,folders, error: 'Ordner konnte nicht gelöscht werden! Das Passwort ist falsch.' });
    }
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
        return view.render('pages/home', {currentPath, folders, files});
    }
    
}
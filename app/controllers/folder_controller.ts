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

        const subfolders = await db.from('folder').where('parent_folder_id', folderId).andWhere('student_id', session.get('student').student_id).select('*');

        return view.render('pages/insideTheFolder', { folderId, files: files || [], subfolders: subfolders || [] });
    }

}
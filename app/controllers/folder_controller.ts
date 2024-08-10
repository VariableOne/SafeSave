import { HttpContext } from "@adonisjs/core/http";
import db from "@adonisjs/lucid/services/db";

export default class FolderController{
  
    public async createFolder({ request, view, session }: HttpContext) {

        const folderName = request.input("folderName");
        const student = session.get('student');

        // Neuen Ordner in die Datenbank einfügen
        await db.table('folder').insert({
            folder_name: folderName,
            student_id: student.student_id
        });

        // Alle Ordner des Studenten abrufen
        const folders = await db.from('folder').select('*').where('student_id', student.student_id);

        // Alle Dateien des Studenten abrufen
        const files = await db.from('file').select('*').where('student_id', student.student_id);

        // View rendern und sicherstellen, dass `folders` und `files` immer Arrays sind
        return view.render('pages/home', { folders: folders || [], files: files || [] });
    }

    public async getFolder({ view }: HttpContext){


        return view.render('pages/insideTheFolder');
    }

}
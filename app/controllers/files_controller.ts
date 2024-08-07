import { HttpContext } from "@adonisjs/core/http";
import db from "@adonisjs/lucid/services/db";
import app from "@adonisjs/core/services/app";
import fs from 'fs'
import mime from 'mime-types'
import path from "path";


export default class FileController {
  public async showUploadForm({ view }: HttpContext) {
    // Zeigt die Upload-Seite an
    const files = await db.from('file').select('*');
    return view.render('/upload', { files });
  }

  public async upload({ request, response, view }: HttpContext) {

    const file = request.file('fieldName', {
        size: '500mb',
        extnames: ['jpg', 'png', 'gif', 'pdf', 'txt', 'docx', 'mp3', 'wav', 'flac', 'webm', 'zip']
      })

      if(!file){
        return response.badRequest('No file uploaded')
      }

      if (!file.isValid) {
        return response.badRequest('No file uploaded')
      }

      await file.move(app.publicPath('uploads'),
                  { name: `${file.clientName}`}
                 )  

      const studentName = request.input('student');

      const student = await db.from('student').where('username', studentName).first();

      if (!student) {
        return response.unauthorized('Student not authenticated')
      }
      console.log('File Size:', file.size);  // Gibt die Dateigröße in der Konsole aus


      await db.table('file').insert({
        file_name: file.clientName,
        file_size: file.size,
        file_format: file.extname,
        file_path: `uploads/${file.fileName}`,
        student_id: student.student_id
      });

    console.log('File uploaded and saved to database successfully '+ student.student_id);
      
    const files = await db.from('file').select('*').where('student_id', student.student_id);

    return view.render('pages/home', {files});

  }

  public async show({ params, response }: HttpContext) {
    console.log(params.id);
    
    const fileId = await db.from('file').where('file_name', params.id).select('file_id').first();
    const fileRecord = await db.from('file').where('file_id', fileId).firstOrFail()

    const filePath = app.publicPath(fileRecord.file_path)
    const fileMime = mime.lookup(filePath) || 'application/octet-stream'

    response.header('Content-Type', fileMime)
    response.header('Content-Disposition', `inline; filename="${fileRecord.file_name}"`)

    return response.stream(fs.createReadStream(filePath))
  }

public async deleteFile({ params, session, response, view }: HttpContext) {
    const fileId = params.id;
    const studentId = session.get('student').student_id;

    // Hol die Datei von der Datenbank
    const fileRecord = await db.from('file').where('file_id', fileId).first();

    if (!fileRecord) {
        return response.notFound('File not found');
    }

    // Überprüfe, ob die Datei zum aktuellen Benutzer gehört
    if (fileRecord.student_id !== studentId) {
        return response.forbidden('Unauthorized');
    }

    // Lösche die Datei aus dem Dateisystem
    const filePath = path.join(app.publicPath(), `uploads/${fileRecord.file_name}`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    console.log(`Deleted file at: ${filePath}`);

    // Lösche die Datei aus der Datenbank
    await db.from('file').where('file_id', fileId).delete();

    // Lade alle verbleibenden Dateien des Benutzers
    const files = await db.from('file').select('*').where('student_id', studentId);

    return view.render('pages/home', { files });
}

  public async renameFile({ response, session, request, view }: HttpContext) {
    const fileId = request.input('fileToRename');
    const newFileName = request.input('newFileName');
    const studentId = session.get('student').student_id;

    // Find the existing file record
    const fileRecord = await db.from('file').where('file_id', fileId).andWhere('student_id', studentId).first();

    if (!fileRecord) {
        return response.status(404).send('File not found');
    }

    const oldFilePath = path.join(app.publicPath(), fileRecord.file_path);
    const fileExtension = path.extname(fileRecord.file_name);
    const newFilePath = path.join(app.publicPath(), 'uploads', `${newFileName}${fileExtension}`);

    // Rename the file in the filesystem
    await fs.promises.rename(oldFilePath, newFilePath);

    // Update the database record
    await db.from('file')
        .where('file_id', fileId).andWhere('student_id', studentId)
        .update({
            file_name: `${newFileName}${fileExtension}`,
            file_path: `uploads/${newFileName}${fileExtension}`
        });

        const files = await db.from('file').select('*').where('student_id', studentId);

        return view.render('pages/home', {files});
}
}

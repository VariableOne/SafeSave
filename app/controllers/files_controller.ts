import { HttpContext } from "@adonisjs/core/http";
import db from "@adonisjs/lucid/services/db";
import app from "@adonisjs/core/services/app";
import fs from 'fs'
import mime from 'mime-types'
import hash from "@adonisjs/core/services/hash";
import path, { join } from "path";


export default class FileController {
  public async showUploadForm({ view }: HttpContext) {
    // Zeigt die Upload-Seite an
    const files = await db.from('file').select('*');
    return view.render('/upload', { files });
  }

  public async upload({ request, response, params, view }: HttpContext) {

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
      const folderId = params.id;
      console.log(folderId);
      const student = await db.from('student').where('username', studentName).first();

      if (!student) {
        return response.unauthorized('Student not authenticated')
      }

      const folderIdToInsert = folderId ? folderId : null;

      await db.table('file').insert({
        file_name: file.clientName,
        file_size: file.size,
        file_format: file.extname,
        file_path: `uploads/${file.fileName}`,
        student_id: student.student_id,
        folder_id: folderIdToInsert 
      });

    console.log('File uploaded and saved to database successfully '+ student.student_id);
   
  // Query für Dateien und Ordner
  const query = db.from('file').select('*').where('student_id', student.student_id);
  
  // Füge die Bedingung für folder_id nur hinzu, wenn folderId definiert ist
  if (folderIdToInsert) {
    query.andWhere('folder_id', folderIdToInsert);
  }

  const files = await query;
  const folders = await db.from('folder').select('*').where('student_id', student.student_id);

    return view.render('pages/home', { files, folders });
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

  public async deleteFile({ request, session, response, view }: HttpContext) {
    const password = request.input('password');
    const fileId = request.input('fileToDelete');
    const student = session.get('student');

    // Benutzer verifizieren
    const result = await db.from('student').select('*').where('student_id', student.student_id).first();

    if (!result) {
        return response.status(404).send('Benutzer nicht gefunden.');
    }

    const checkPassword = await hash.verify(result.password, password);

    if (!checkPassword) {
        const files = await db.from('file').select('*').where('student_id', student.student_id);
        const folders = await db.from('folder').select('*').where('student_id', student.student_id);
        return view.render('pages/home', { files,folders, deleteError: 'Datei konnte nicht gelöscht werden! Das Passwort ist falsch.' });
    }

    const file = await db.from('file').where('file_id', fileId).first();
    if (file) {
        // Dynamisch den vollständigen Pfad zur Datei erzeugen
        const filePath = join('C:\\Users\\uemmu\\SafeSave\\public', 'uploads', file.file_name);
        console.log('Versuche, Datei zu löschen:', filePath);

        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Fehler beim Löschen der Datei:', err);
            } else {
                console.log('Datei erfolgreich gelöscht:', filePath);
            }
        });

        // Datei auch aus der Datenbank löschen
        await db.from('file').where('file_id', fileId).delete();
    }

    const files = await db.from('file').select('*').where('student_id', student.student_id);
    const folders = await db.from('folder').select('*').where('student_id', student.student_id);
    return view.render('pages/home', { files, folders });
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
        const folders = await db.from('folder').select('*').where('student_id', studentId);

        return view.render('pages/home', { files,folders });
}

public async moveFile({ request, response, session, view }: HttpContext) {
  const fileId = request.input('file_id');
  const folderId = request.input('folder_id');
  const studentId = session.get('student').student_id;

  // Prüfen, ob die Datei existiert
  const file = await db.from('file').where('file_id', fileId).andWhere('student_id', studentId).first();
  if (!file) {
    return response.status(404).send('Datei nicht gefunden');
  }

  // Datenbank aktualisieren
  await db.from('file')
    .where('file_id', fileId).andWhere('student_id', studentId)
    .update({
      folder_id: folderId,
    });

  // Dateien und Ordner erneut abrufen, um die Seite zu aktualisieren
  const files = await db.from('file').select('*').where('student_id', studentId);
  const folders = await db.from('folder').select('*').where('student_id', studentId);

  return view.render('pages/home', { files, folders });
}
}

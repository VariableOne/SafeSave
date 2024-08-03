import { HttpContext } from "@adonisjs/core/http";
import path from "path";
import fs from 'fs';
import { fileURLToPath } from "url";
import db from "@adonisjs/lucid/services/db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createDirectorySync(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log('Directory created successfully');
  }
}

export default class FileController {
  public async showUploadForm({ response }: HttpContext) {
    return response.redirect().back();
  }

  public async upload({ request, response, session }: HttpContext) {
    const file = request.file('file');
    if (!file) {
      return response.badRequest('No file uploaded');
    }

    if (file.hasErrors) {
      return response.badRequest(file.errors);
    }

    const uploadDir = path.join(__dirname, '../../uploads');
    createDirectorySync(uploadDir);

    try {

      // Speichern in die Datenbank
      const insertResult = await db.table('file').insert({
        file_name: file.clientName,
        file_size: file.size,
        file_format: file.extname,
        student_id: session.get('student').student_id
      });

      console.log('Insert result:', insertResult); // Ausgabe des Einfüge-Ergebnisses

      console.log('File uploaded and saved to database successfully');
      return response.redirect().back();

    } catch (error) {
      console.error('Error during file upload:', error);
      return response.internalServerError('An error occurred while uploading the file');
    }
  }
}

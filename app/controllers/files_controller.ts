import { HttpContext } from "@adonisjs/core/http";
import db from "@adonisjs/lucid/services/db";
import app from "@adonisjs/core/services/app";
import { cuid } from "@adonisjs/core/helpers";


export default class FileController {
  public async showUploadForm({ view }: HttpContext) {
    // Zeigt die Upload-Seite an
    const files = await db.from('file').select('*');
    return view.render('/upload', { files });
  }

  public async upload({ request, response }: HttpContext) {

    const file = request.file('fieldName', {
        size: '10mb',
        extnames: ['jpg', 'png', 'gif', 'pdf', 'txt', 'docx', 'mp3', 'wav', 'flac']
      })

      if(!file){
        return response.badRequest('No file uploaded')
      }

      if (!file.isValid) {
        return response.badRequest('No file uploaded')
      }

      await file.move(app.publicPath('uploads'),
                  { name: `${cuid()}.${file.extname}`}
                 )  

      const studentName = request.input('student');

      const student = await db.from('student').where('username', studentName).first();

      if (!student) {
        return response.unauthorized('Student not authenticated')
      }

      await db.table('file').insert({
        file_name: file.clientName,
        file_size: file.size,
        file_format: file.extname,
        student_id: student.student_id
      });

      console.log('File uploaded and saved to database successfully '+ student.student_id);
      return response.redirect('/');

  }
}

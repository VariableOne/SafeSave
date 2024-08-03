import { HttpContext } from "@adonisjs/core/http";
import db from "@adonisjs/lucid/services/db";

export default class FolderController{


    public async createNewFolder({ request, view }: HttpContext){

        const folderName = request.input("folderName");

        const newFolder = await db.table('folder').insert({
         
            folder_name: folderName
        });

        view.render("pages/home", {newFolder});

        }

}
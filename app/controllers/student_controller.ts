// import type { HttpContext } from '@adonisjs/core/http'

import { HttpContext } from "@adonisjs/core/http";
import hash from "@adonisjs/core/services/hash";
import db from "@adonisjs/lucid/services/db";

export default class StudentsController {
  //  static registerProcess: any;

    //Registrierung neuer Benutzer
    public async registerProcess({ request, view }: HttpContext) {

        const username = request.input('username');
        const email = request.input('email');
        const matrikelnummer = request.input('matrikelnummer');
        const password = request.input('password');
        const confirmPassword = request.input('confirmPassword');

        if (password !== confirmPassword) {
            console.log("Passwords do not match");
            return view.render('pages/registration', { registrationError: 'Passwort und Bestätigungspasswort stimmen nicht überein!' });
        }

        const uppercaseChars = password.match(/[A-Z]/g);
        const digitChars = password.match(/[0-9]/g);
        if (password.length < 8 || !uppercaseChars || uppercaseChars.length < 2 || !digitChars || digitChars.length < 2) {
            console.log("Password criteria not met");
            return view.render('pages/registration', { registrationError: 'Das Passwort muss mindestens 8 Zeichen lang sein und mindestens 2 Großbuchstaben sowie 2 Zahlen enthalten!' });
        }

        const existingUser = await db.from('student').where('username', username).orWhere('email', email).first();
        if (existingUser) {
            console.log("User already exists");
            return view.render('pages/registration', { registrationError: 'Sie sind bereits registriert!' });
        }

        const hashedPassword = await hash.make(password);
        const hashedMatrikelnummer = await hash.make(matrikelnummer);

        const result = await db.table('student').insert({
            username: username,
            email: email,
            matrikelnummer: hashedMatrikelnummer,
            password: hashedPassword
        });
        const currentPath = request.url();
        return view.render('pages/auth', { result, currentPath });

    }

    //Funktion wenn man Passwort ändern will: Zuerst werden Matrikelnummer und Email überprüft
    public async checkDataOfStudent({ view, request }: HttpContext){
    
        const matrikelnummer = request.input('matrikelnummer')
        const email = request.input('email')
        const student = await db.from('student').where('email', email).first()

        if(!student){
            return view.render('pages/resetPassword', {error: 'Email oder Matrikelnummer ist falsch.' });
        }

        const isMatch = await hash.verify(student.matrikelnummer, matrikelnummer)

        if(!isMatch){

            return view.render('pages/resetPassword', {error: 'Email oder Matrikelnummer ist falsch.' });        
        }
            const currentPath = request.url();
            return view.render('pages/newPassword', {email, currentPath});
    }

    //Funktion, um dann neues Passwort anzulegen nach checkDataOfStudent
    public async setNewPassword({ request, view }: HttpContext){

        const password = request.input('password');
        const confirmPassword = request.input('confirmPassword');
        const email = request.input('email')

        if (password !== confirmPassword) {
            console.log("Passwords do not match");
            return view.render('pages/newPassword', { passwordError: 'Passwort und Bestätigungspasswort stimmen nicht überein!' });
        }

        const uppercaseChars = password.match(/[A-Z]/g);
        const digitChars = password.match(/[0-9]/g);
        if (password.length < 8 || !uppercaseChars || uppercaseChars.length < 2 || !digitChars || digitChars.length < 2) {
            console.log("Password criteria not met");
            return view.render('pages/newPassword', { passwordError: 'Das Passwort muss mindestens 8 Zeichen lang sein und mindestens 2 Großbuchstaben sowie 2 Zahlen enthalten!' });
        }
        const hashedPassword = await hash.make(password);
        await db.from('student').where('email', email).update({

            password: hashedPassword

        })
        const currentPath = request.url();
        return view.render('pages/auth', {currentPath, successMessage: 'Passwort erfolgreich zurückgesetzt!' })

    }

    //Anmeldung eines Benutzers
    public async loginProcess({ view, request, session }: HttpContext) {

        const email = request.input('email');

        if (request.method() === 'POST') {
            const result = await db.from('student').select('*').where('email', email).first();

            if (!result) {
                console.log("User does not exist");
                return view.render('pages/auth', { loginError: 'Email oder Passwort ist falsch.' });
            }

            const authenticated = await hash.verify(result.password, request.input('password'));

            if (!authenticated) {
                console.log("Password incorrect");
                return view.render('pages/auth', { loginError: 'Email oder Passwort ist falsch.' });
            }

            const student = {
                student_id: result.student_id,
                email: result.email,
                username: result.username
            };

            session.put('student', student);
            const currentPath = request.url();
            const files = await db.from('file').select('*').where('student_id', student.student_id);
            const folders = await db.from('folder').select('*').where('student_id', student.student_id);

            return view.render('pages/home', { student, files, folders, currentPath});
        }
    }

    //Abmeldung eines Benutzers
    public async logout({ session, view, request }: HttpContext) {
        const currentPath = request.url();
        session.forget('student');
        return view.render('pages/auth', {currentPath});
    }

    //rendern der Anmeldeseite
    public async loginForm({ view,request }: HttpContext) {
       // const currentPath = request.url();
        return view.render('pages/auth');
    }


}
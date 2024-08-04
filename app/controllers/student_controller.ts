// import type { HttpContext } from '@adonisjs/core/http'

import { HttpContext } from "@adonisjs/core/http";
import hash from "@adonisjs/core/services/hash";
import db from "@adonisjs/lucid/services/db";

export default class StudentsController {

 
    public async registerProcess({ request, view }: HttpContext) {

        const username = request.input('username');
        const email = request.input('email');
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

        const result = await db.table('student').insert({
            username: username,
            email: email,
            password: hashedPassword
        });

        return view.render('pages/auth', { result });

    }

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

            const files = await db.from('file').select('*');

            session.put('student', student);

            return view.render('pages/home', { student, files });
        }
    }

    public async logout({ session, view }: HttpContext) {

        session.forget('student');
        return view.render('pages/auth');
    }

    public async loginForm({ view }: HttpContext) {

        return view.render('pages/auth');
    }

}
/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import StudentsController from '#controllers/student_controller';
import router from '@adonisjs/core/services/router'

router.on('/').render('pages/auth')

router.post('/registration', [StudentsController, 'registerProcess']);
router.get('/registration', async ({ view }) => {
  return view.render('pages/registration')
})
router.post('/auth', [StudentsController, 'loginProcess']);
router.post('/home', [StudentsController, 'logout']);
router.get('/logout', [StudentsController, 'logout'])

  router.get('/home', async ({ view }) => {
    return view.render('pages/home')
  })



/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import FilesController from '#controllers/files_controller';
import StudentsController from '#controllers/student_controller';
import router from '@adonisjs/core/services/router'

router.on('/').render('pages/auth')

router.post('/registration', [StudentsController, 'registerProcess']);
router.get('/registration', async ({ view }) => {
  return view.render('pages/registration')
})
router.post('/auth', [StudentsController, 'loginProcess'])
router.get('/auth', [StudentsController, 'loginForm'])

router.get('/logout', [StudentsController, 'logout'])

router.post('/home', [StudentsController, 'logout'])
  router.get('/home', async ({ view }) => {
    return view.render('pages/home')
  })

router.get('/upload', [FilesController, 'showUploadForm'])
router.post('/upload', [FilesController, 'upload'])

router.get('/files/:id', [FilesController, 'show'])
router.post('/files/:id',  [FilesController, 'deleteFile'])

router.post('/rename', [FilesController, 'renameFile'])

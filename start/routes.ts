/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import FilesController from '#controllers/files_controller';
import FolderController from '#controllers/folder_controller';
import StudentsController from '#controllers/student_controller';
import router from '@adonisjs/core/services/router'


router.on('/').render('pages/auth')

router.post('/registration', [StudentsController, 'registerProcess']);
router.get('/registration', async ({ view }) => {
  return view.render('pages/registration')
})
router.post('/home', [StudentsController, 'loginProcess'])
router.get('/home', [StudentsController, 'loginForm'])

router.get('/logout', [StudentsController, 'logout'])

  router.post('/auth', async ({ view }) => {
    return view.render('pages/auth')
  })

router.get('/upload', [FilesController, 'showUploadForm'])
router.post('/upload', [FilesController, 'upload'])

router.get('/files/:id', [FilesController, 'show'])
router.post('/delete',  [FilesController, 'deleteFile'])

router.post('/rename', [FilesController, 'renameFile'])
router.post('/createFolder', [FolderController, 'createFolder'])
router.get('/folder/:id',  [FolderController, 'getFolder'])

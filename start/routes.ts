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

router.post('/auth', async ({ view }) => {
  return view.render('pages/auth')
})

router.get('/logout', [StudentsController, 'logout'])

router.post('/home', [StudentsController, 'loginProcess'])
router.get('/home', [StudentsController, 'loginForm'])

router.post('/upload', [FilesController, 'upload'])
router.post('/folder/:id',  [FilesController, 'upload'])
router.get('/upload', [FilesController, 'showUploadForm'])
router.post('/delete',  [FilesController, 'deleteFile'])
router.get('/files/:id', [FilesController, 'show'])
router.post('/rename', [FilesController, 'renameFile'])
router.post('/move-file', [FilesController,'moveFile']);

router.post('/createFolder', [FolderController, 'createFolder'])
router.post('/deleteFolder', [FolderController, 'deleteFolder'] )
router.get('/folder/:id',  [FolderController, 'getFolder'])
router.post('renameFolder', [FolderController, 'renameFolder'] )

router.get('/resetPassword', async ({ view }) => {
  return view.render('pages/resetPassword')
})

router.get('/generalRules', async ({ view }) => {
  return view.render('pages/generalRules')
})

router.post('/newPassword', [StudentsController, 'checkDataOfStudent'])
router.post('/resetAccomplished', [StudentsController, 'setNewPassword'])
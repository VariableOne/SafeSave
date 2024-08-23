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
router.get('/registration', async ({ view, request }) => {
  const currentPath = request.url();
  return view.render('pages/registration',{currentPath})
})

router.post('/auth', async ({ view, request }) => {
  const currentPath = request.url();
  return view.render('pages/auth',{currentPath})
})

router.get('/logout', [StudentsController, 'logout'])
router.get('/resetPassword', async ({ view,request }) => {
  const currentPath = request.url();
  return view.render('pages/resetPassword',{currentPath})
})
router.post('/newPassword', [StudentsController, 'checkDataOfStudent'])
router.post('/resetAccomplished', [StudentsController, 'setNewPassword'])

router.get('/generalRules', async ({ view, request }) => {
  const currentPath = request.url();
  return view.render('pages/generalRules', {currentPath})
})

router.post('/home', [StudentsController, 'loginProcess'])
router.get('/home', [StudentsController, 'loginForm'])

//Alle Routen bzgl. den Dateien
router.post('/upload', [FilesController, 'upload'])
router.post('/folder/:id',  [FilesController, 'upload'])
router.get('/upload', [FilesController, 'showUploadForm'])
router.post('/delete',  [FilesController, 'deleteFile'])
router.get('/files/:id', [FilesController, 'show'])
router.post('/rename', [FilesController, 'renameFile'])
router.post('/move-file', [FilesController,'moveFile']);


//Alle Routen bzgl. den Ordnern
router.post('/createFolder', [FolderController, 'createFolder'])
router.post('/deleteFolder', [FolderController, 'deleteFolder'] )
router.get('/folder/:id',  [FolderController, 'getFolder'])
router.post('renameFolder', [FolderController, 'renameFolder'] )
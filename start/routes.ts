/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

router.on('/').render('pages/auth')

router.get('/registration', async ({ view }) => {
    return view.render('pages/registration')
  })

  router.get('/auth', async ({ view }) => {
    return view.render('pages/auth')
  })


/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
const PostsController = () => import('#controllers/posts_controller')
const AdminDashboardController = () => import('#controllers/admin/dashboard_controller')
const AuthController = () => import('#controllers/auth_controller')

router.get('/', async ({ view }) => {
  return view.render('pages/home')
})

router.get('/posts', [PostsController, 'index']).as('posts.index')
router.post('/posts', [PostsController, 'store'])

router
  .group(() => {
    router.get('/', [AdminDashboardController, 'dashboard'])
  })
  .prefix('/admin')
  .middleware([middleware.auth(), middleware.admin()])

// Auth routes with correct middleware syntax
router
  .group(() => {
    router.get('/login', [AuthController, 'showLogin']).as('auth.login')
    router.post('/login', [AuthController, 'login']).as('auth.login.store')
  })
  .middleware([middleware.guest()])

router
  .group(() => {
    router.post('/logout', [AuthController, 'logout']).as('auth.logout')
  })
  .middleware([middleware.auth()])

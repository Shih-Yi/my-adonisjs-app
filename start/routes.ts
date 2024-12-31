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
  .use(middleware.admin())

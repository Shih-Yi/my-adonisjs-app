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
// const AdminUsersController = () => import('#controllers/admin/users_controller')
// const AdminPostsController = () => import('#controllers/admin/posts_controller')

router.get('/', async ({ view }) => {
  return view.render('pages/home')
})

router.get('/posts', [PostsController, 'index']).as('posts.index')
router.post('/posts', [PostsController, 'store'])

router
  .group(() => {
    router.get('/', [AdminDashboardController, 'dashboard'])

    // router.get('/users', [AdminUsersController, 'index'])
    // router.post('/users', [AdminUsersController, 'store'])
    // router.get('/users/:id/edit', [AdminUsersController, 'edit'])
    // router.put('/users/:id', [AdminUsersController, 'update'])

    // router.get('/posts', [AdminPostsController, 'index'])
    // router.get('/posts/create', [AdminPostsController, 'create'])
    // router.post('/posts', [AdminPostsController, 'store'])
    // router.get('/posts/:id/edit', [AdminPostsController, 'edit'])
    // router.put('/posts/:id', [AdminPostsController, 'update'])
    // router.delete('/posts/:id', [AdminPostsController, 'destroy'])
  })
  .prefix('/admin')
  .middleware([middleware.auth(), middleware.admin()])

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
import i18nManager from '@adonisjs/i18n/services/main'

const HomeController = () => import('#controllers/home_controller')
const PagesController = () => import('#controllers/pages_controller')
const PostsController = () => import('#controllers/posts_controller')
const AdminDashboardController = () => import('#controllers/admin/dashboard_controller')
const AdminPagesController = () => import('#controllers/admin/pages_controller')
const AdminAuthController = () => import('#controllers/admin/auth_controller')

// Public routes (no authentication required)
router.get('/', [HomeController, 'index'])
router.get('/posts', [PostsController, 'index']).as('posts.index')
router.post('/posts', [PostsController, 'store'])

// Language switcher
router
  .get('/language/:locale', async ({ params, response, i18n, session }) => {
    const { locale } = params
    const supportedLocales = i18nManager.supportedLocales()

    if (supportedLocales.includes(locale)) {
      await i18n.switchLocale(locale)
      session.put('locale', locale)
    }
    return response.redirect().back()
  })
  .as('language')

// Public API routes
router
  .group(() => {
    router.get('/navigation', [PagesController, 'getNavigation'])
    router.get('/:type/pages', [PagesController, 'getPageHierarchy'])
    router.get('/:type/:slug', [PagesController, 'show'])
    router.get('/:type/:parentSlug/:slug', [PagesController, 'show'])
    router.get('/:type/:grandparentSlug/:parentSlug/:slug', [PagesController, 'show'])
  })
  .prefix('/api')

// Admin authentication routes (for login)
router
  .group(() => {
    router.get('/admin/login', [AdminAuthController, 'show']).as('admin.auth.login')
    router.post('/admin/login', [AdminAuthController, 'login']).as('admin.auth.login.store')
  })
  .middleware([middleware.guest()])

// Admin logout route (needs auth middleware)
router
  .post('/admin/logout', [AdminAuthController, 'logout'])
  .as('admin.auth.logout')
  .middleware([middleware.auth({ guards: ['admin'] })])

// Admin protected routes
router
  .group(() => {
    // Admin dashboard
    router.get('/', [AdminDashboardController, 'dashboard']).as('admin.dashboard')

    // Admin pages management
    router.get('/pages', [AdminPagesController, 'index']).as('admin.pages.index')
    router.get('/pages/create', [AdminPagesController, 'create']).as('admin.pages.create')
    router.post('/pages', [AdminPagesController, 'store']).as('admin.pages.store')
    router.get('/pages/:id/edit', [AdminPagesController, 'edit']).as('admin.pages.edit')
    router.get('/pages/:id', [AdminPagesController, 'show']).as('admin.pages.show')
    router.put('/pages/:id', [AdminPagesController, 'update']).as('admin.pages.update')
    router.delete('/pages/:id', [AdminPagesController, 'destroy']).as('admin.pages.destroy')
  })
  .prefix('/admin')
  .middleware([middleware.auth({ guards: ['admin'] }), middleware.admin()])

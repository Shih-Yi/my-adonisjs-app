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
const AuthController = () => import('#controllers/auth_controller')

router.get('/', [HomeController, 'index'])

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

router
  .group(() => {
    // Navigation data for all pages
    router.get('/navigation', [PagesController, 'getNavigation'])

    // Get pages by type with full hierarchy
    router.get('/:type/pages', [PagesController, 'getPageHierarchy'])

    // Dynamic routes for nested pages
    router.get('/:type/:slug', [PagesController, 'show'])
    router.get('/:type/:parentSlug/:slug', [PagesController, 'show'])
    router.get('/:type/:grandparentSlug/:parentSlug/:slug', [PagesController, 'show'])
  })
  .prefix('/api')

// Admin routes for managing pages
router
  .group(() => {
    router.get('/pages', [AdminPagesController, 'index'])
    router.post('/pages', [AdminPagesController, 'store'])
    router.put('/pages/:id', [AdminPagesController, 'update'])
    router.delete('/pages/:id', [AdminPagesController, 'destroy'])
  })
  .prefix('/admin')
  .middleware([middleware.guest()])

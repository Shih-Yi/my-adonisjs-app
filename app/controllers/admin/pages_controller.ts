import { HttpContext } from '@adonisjs/core/http'
import Page from '#models/page'
// import { sanitizeHtml } from '#services/html_sanitizer'

export default class AdminPagesController {
  /**
   * Display a listing of pages
   */
  async index({ view, auth }: HttpContext) {
    const user = auth.user!
    const pages = await Page.all()
    return view.render('admin/pages/index', { pages })
  }

  /**
   * Display page details
   */
  async show({ params, view }: HttpContext) {
    const page = await Page.findOrFail(params.id)

    // If there is a parent page, preload it
    if (page.parentId) {
      await page.load('parent')
    }

    return view.render('admin/pages/show', { page })
  }

  /**
   * Show the form for creating a new page
   */
  async create({ view }: HttpContext) {
    return view.render('admin/pages/create', {
      types: Page.PAGE_TYPES,
    })
  }

  /**
   * Store a new page
   */
  async store({ request, response }: HttpContext) {
    const data = request.only(['title', 'type', 'content', 'parentId'])
    await Page.create(data)
    return response.redirect().toRoute('admin.pages.index')
  }

  /**
   * Show the form for editing a page
   */
  async edit({ params, view }: HttpContext) {
    const page = await Page.findOrFail(params.id)

    return view.render('admin/pages/edit', {
      page,
      types: Page.PAGE_TYPES,
    })
  }

  /**
   * Update page
   */
  async update({ request, response, params }: HttpContext) {
    console.log('Method:', request.method())
    const page = await Page.findOrFail(params.id)
    const data = request.only(['title', 'type', 'content', 'isActive'])

    await page.merge(data).save()
    return response.redirect().toRoute('admin.pages.show', { id: page.id })
  }

  /**
   * Delete page
   */
  async destroy({ params, response, request }: HttpContext) {
    console.log('Method:', request.method())
    console.log('URL:', request.url())
    console.log('Params:', params)

    const page = await Page.findOrFail(params.id)
    await page.delete()

    return response.redirect().toRoute('admin.pages.index')
  }
}

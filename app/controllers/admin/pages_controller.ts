import { HttpContext } from '@adonisjs/core/http'
import Page from '#models/page'
// import { sanitizeHtml } from '#services/html_sanitizer'

export default class AdminPagesController {
  /**
   * Display a listing of pages
   */
  async index({ view, auth }: HttpContext) {
    const user = auth.user!

    const pages = await Page.query()
      .preload('parent')
      .orderBy([
        { column: 'type', order: 'asc' },
        { column: 'parent_id', order: 'asc', nulls: 'first' },
        { column: 'id', order: 'asc' },
        { column: 'order', order: 'asc' },
      ])

    // Reorganize data at application layer
    const organizedPages = pages.sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type)
      const aPath = this.getPagePath(a, pages)
      const bPath = this.getPagePath(b, pages)
      return aPath.localeCompare(bPath)
    })

    return view.render('admin/pages/index', { pages: organizedPages })
  }

  // get page path
  private getPagePath(page: Page, allPages: Page[]) {
    const path = []
    let currentPage = page
    while (currentPage.parentId) {
      path.unshift(currentPage.id.toString().padStart(10, '0'))
      currentPage = allPages.find((p) => p.id === currentPage.parentId)!
    }
    path.unshift(currentPage.id.toString().padStart(10, '0'))
    return path.join('.')
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
    // Get first and second level pages only
    const parentPages = await Page.query()
      .where((query) => {
        query
          .whereNull('parent_id') // First level
          .orWhereIn(
            'parent_id',
            Page.query().select('id').whereNull('parent_id') // Second level (children of first level)
          )
      })
      .orderBy('title')

    return view.render('admin/pages/create', {
      types: Page.PAGE_TYPES,
      parentPages,
    })
  }

  /**
   * Store a new page
   */
  async store({ request, response }: HttpContext) {
    const data = request.only(['title', 'type', 'content', 'parentId', 'isActive'])

    // Convert empty string to null for parentId
    if (data.parentId === '') {
      data.parentId = null
    }

    await Page.create(data)
    return response.redirect().toRoute('admin.pages.index')
  }

  /**
   * Show the form for editing a page
   */
  async edit({ params, view }: HttpContext) {
    const page = await Page.findOrFail(params.id)

    // Get first and second level pages only, excluding current page
    const parentPages = await Page.query()
      .where((query) => {
        query
          .whereNull('parent_id') // First level
          .orWhereIn(
            'parent_id',
            Page.query().select('id').whereNull('parent_id') // Second level (children of first level)
          )
      })
      .whereNot('id', page.id)
      .orderBy('title')

    return view.render('admin/pages/edit', {
      page,
      types: Page.PAGE_TYPES,
      parentPages,
    })
  }

  /**
   * Update page
   */
  async update({ request, response, params }: HttpContext) {
    console.log('Method:', request.method())
    const page = await Page.findOrFail(params.id)
    const data = request.only(['title', 'type', 'content', 'parentId', 'isActive'])

    // Convert empty string to null for parentId
    if (data.parentId === '') {
      data.parentId = null
    }

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

import { HttpContext } from '@adonisjs/core/http'
import Page from '#models/page'
import db from '@adonisjs/lucid/services/db'
import PageTranslation from '#models/page_translation'
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
        { column: 'order', order: 'asc' },
      ])

    // Reorganize data at application layer
    const organizedPages = pages.sort((a, b) => {
      // if both are first level pages, sort by order
      // if both have the same parent page, sort by order
      if (a.parentId === b.parentId) {
        return a.order - b.order
      }

      // other cases sort by full path
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
      // 加入當前頁面的 order
      path.unshift(currentPage.order.toString().padStart(10, '0'))
      // 找到父頁面
      currentPage = allPages.find((p) => p.id === currentPage.parentId)!
    }

    // 加入根頁面的 order
    path.unshift(currentPage.order.toString().padStart(10, '0'))
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
      .preload('children') // load children
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

    const page = await Page.create(data)
    const translations = request.input('translations', {})

    // 創建每個語言版本
    for (const [locale, content] of Object.entries(translations)) {
      await PageTranslation.create({
        pageId: page.id,
        locale,
        content: content as string,
      })
    }

    return response.redirect().toRoute('admin.pages.index')
  }

  /**
   * Show the form for editing a page
   */
  async edit({ params, view }: HttpContext) {
    const page = await Page.findOrFail(params.id)
    await page.load('children') // Load children for view

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
      .preload('children') // load children
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
    const page = await Page.findOrFail(params.id)
    await page.load('children') // Load children to check

    const data = request.only(['title', 'type', 'content', 'parentId', 'isActive'])

    // first level page can't change parentId and type
    if (page.parentId === null && (data.parentId !== null || data.type !== page.type)) {
      return response
        .status(422)
        .send({ error: 'Cannot change parent or type of a first level page' })
    }

    // second and third level page can't set to first level page
    if (page.parentId !== null && data.parentId === '') {
      return response.status(422).send({ error: 'Cannot change child page to first level page' })
    }

    // if page has children, can't change parentId
    if (page.children.length > 0 && Number.parseInt(data.parentId, 10) !== page.parentId) {
      return response
        .status(422)
        .send({ error: 'Cannot change parent of a page that has children!' })
    }

    // Convert empty string to null for parentId
    if (data.parentId === '') {
      data.parentId = null
    }

    // 處理翻譯
    const translations = request.input('translations', {})

    // 更新每個語言版本
    for (const [locale, content] of Object.entries(translations)) {
      await PageTranslation.updateOrCreate(
        { pageId: page.id, locale },
        { content: content as string }
      )
    }

    await page.merge(data).save()
    return response.redirect().toRoute('admin.pages.show', { id: page.id })
  }

  /**
   * Delete page
   */
  async destroy({ params, response }: HttpContext) {
    const page = await Page.findOrFail(params.id)
    await page.load('children') // load children

    // check if it's a first level page
    if (page.parentId === null) {
      return response.status(422).send({ error: 'Cannot delete first level page' })
    }

    // check if it has children
    if (page.children.length > 0) {
      return response.status(422).send({ error: 'Cannot delete page that has children' })
    }

    await page.delete()
    return response.redirect().toRoute('admin.pages.index')
  }

  async reorder({ request, response }: HttpContext) {
    const { updates } = request.body()

    // Start a transaction
    const trx = await db.transaction()
    console.log('updates', updates)
    try {
      for (const update of updates) {
        await Page.query({ client: trx }).where('id', update.id).update({ order: update.order })
      }

      await trx.commit()
      console.log('commit')
      return response.status(200).send({ message: 'Order updated successfully' })
    } catch (error) {
      console.log('error', error)
      await trx.rollback()
      return response.status(500).send({ error: 'Failed to update order' })
    }
  }
}

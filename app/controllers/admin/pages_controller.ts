import { HttpContext } from '@adonisjs/core/http'
import Page from '#models/page'
import db from '@adonisjs/lucid/services/db'
import PageTranslation from '#models/page_translation'
import string from '@adonisjs/core/helpers/string'
// import { sanitizeHtml } from '#services/html_sanitizer'

interface Translation {
  title?: string
  content?: string
}

export default class AdminPagesController {
  /**
   * Display a listing of pages
   */
  async index({ view, auth }: HttpContext) {
    const user = auth.user!

    const pages = await Page.query()
      .preload('parent')
      .preload('translations')
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
    const page = await Page.query().preload('translations').where('id', params.id).firstOrFail()

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
      .preload('translations') // load translations
      .preload('children') // load children

    return view.render('admin/pages/create', {
      types: Page.PAGE_TYPES,
      parentPages,
    })
  }

  /**
   * Store a new page
   */
  async store({ request, response }: HttpContext) {
    const data = request.only(['type', 'parentId', 'isActive', 'slug'])
    const translations = request.input('translations', {})

    // 檢查英文標題是否存在
    if (!translations.en?.title?.trim()) {
      return response.status(422).send({
        error: 'English title is required',
      })
    }
    data.slug = string.dashCase(translations.en.title)

    // 'on' -> true, undefined -> false
    data.isActive = !!data.isActive

    // 檢查父頁面是否存在且是合法的父頁面
    if (data.parentId) {
      const parentPage = await Page.query()
        .where('id', data.parentId)
        .where((query) => {
          query
            .whereNull('parent_id') // 第一層
            .orWhereIn(
              'parent_id',
              Page.query().select('id').whereNull('parent_id') // 第二層
            )
        })
        .first()

      if (!parentPage) {
        return response.status(422).send({
          error: 'Invalid parent page. Can only select first or second level page as parent.',
        })
      }

      // 檢查父頁面的類型是否匹配
      if (parentPage.type !== data.type) {
        return response.status(422).send({ error: 'Parent page type does not match' })
      }
    }

    // Convert empty string to null for parentId
    if (data.parentId === '' || data.parentId === undefined) {
      data.parentId = null
    }

    const page = await Page.create(data)

    // 儲存每個語言版本
    for (const [locale, translation] of Object.entries(translations) as [string, Translation][]) {
      if (translation) {
        await PageTranslation.create({
          pageId: page.id,
          locale,
          title: translation.title || '', // 英文已經檢查過了，其他語言可以是空字串
          content: translation.content || '',
        })
      }
    }

    return response.redirect().toRoute('admin.pages.index')
  }

  /**
   * Show the form for editing a page
   */
  async edit({ params, view }: HttpContext) {
    const page = await Page.query()
      .preload('children')
      .preload('translations')
      .where('id', params.id)
      .firstOrFail()

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
      .where('type', page.type)
      .preload('translations')
      .preload('children') // load children

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
    const data = request.only(['type', 'parentId', 'isActive'])
    const translations = request.input('translations', {})
    console.log('translations', translations)
    console.log('data.parentId', data.parentId)
    // 檢查英文標題是否存在
    if (!translations.en?.title?.trim()) {
      return response.status(422).send({
        error: 'English title is required',
      })
    }

    const page = await Page.findOrFail(params.id)
    await page.load('children')

    data.isActive = !!data.isActive // 'on' -> true, undefined -> false

    if (data.parentId === '' || data.parentId === undefined || data.parentId === null) {
      data.parentId = null
    }

    // For first level pages: ignore submitted type and use original value
    if (page.parentId === null) {
      data.type = page.type // Force use original type
      data.parentId = null // Force keep as null
    }

    if (page.children?.length > 0) {
      data.type = page.type // Force use original type
      data.parentId = page.parentId // Force keep as original parentId
    }

    // first level page can't change parentId and type
    if (page.parentId === null && (data.parentId !== null || data.type !== page.type)) {
      return response
        .status(422)
        .send({ error: 'Cannot change parent or type of a first level page' })
    }

    // 如果要修改父頁面，檢查新的父頁面是否合法
    if (page.parentId !== null && data.parentId && data.parentId !== page.parentId) {
      const parentPage = await Page.query()
        .where('id', data.parentId)
        .where((query) => {
          query
            .whereNull('parent_id') // 第一層
            .orWhereIn(
              'parent_id',
              Page.query().select('id').whereNull('parent_id') // 第二層
            )
        })
        .first()

      if (!parentPage) {
        return response.status(422).send({
          error: 'Invalid parent page. Can only select first or second level page as parent.',
        })
      }

      // 檢查父頁面的類型是否匹配
      if (parentPage.type !== data.type) {
        return response.status(422).send({ error: 'Parent page type does not match' })
      }
    }
    console.log('page.children.length', page.children.length)
    console.log('Page parentId', page.parentId)
    console.log('data.parentId', data.parentId)
    // if page has children, can't change parentId
    if (
      page.children.length > 0 &&
      page.parentId !== null &&
      Number.parseInt(data.parentId, 10) !== page.parentId
    ) {
      return response
        .status(422)
        .send({ error: 'Cannot change parent of a page that has children!' })
    }

    // Convert empty string to null for parentId
    if (data.parentId === '') {
      data.parentId = null
    }

    // 更新翻譯
    for (const [locale, translation] of Object.entries(translations) as [string, Translation][]) {
      if (translation) {
        await PageTranslation.updateOrCreate(
          { pageId: page.id, locale },
          {
            title: translation.title || '',
            content: translation.content || '',
          }
        )
      }
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

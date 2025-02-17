import { HttpContext } from '@adonisjs/core/http'
import Page from '#models/page'
import db from '@adonisjs/lucid/services/db'
import PageTranslation from '#models/page_translation'
import PagePolicy from '#policies/page_policy'
import { pageValidator } from '#validators/page_validator'
import string from '@adonisjs/core/helpers/string'
// import { sanitizeHtml } from '#services/html_sanitizer'

interface Translation {
  title?: string
  content?: string
}

export default class AdminPagesController {
  #pagePolicy = new PagePolicy()

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
    try {
      const formData = request.all()
      console.log('formData--', formData)

      // 處理 parentId
      if (formData.parentId === '' || formData.parentId === undefined) {
        formData.parentId = null
      }

      // 'on' -> true, undefined -> false
      formData.isActive = !!formData.isActive

      const data = await pageValidator.validate(formData)

      const validatedData = {
        ...data,
        slug: string.dashCase(data.translations?.en?.title || ''),
      }
      console.log('validatedData--', validatedData)

      // 如果要改變父頁面，檢查新父頁面是否合法
      const parentPage = await Page.findOrFail(data.parentId)
      if (data.parentId) {
        if (!this.#pagePolicy.isValidParent(parentPage)) {
          return response.unprocessableEntity({ error: 'Invalid parent page' })
        }
      }

      if (parentPage.type !== data.type) {
        return response.status(422).send({ error: 'Parent page type does not match' })
      }

      // 創建頁面
      const page = await Page.create(validatedData)

      // 創建翻譯
      for (const [locale, translation] of Object.entries(data.translations)) {
        await PageTranslation.create({
          pageId: page.id,
          locale,
          title: translation?.title || '',
          content: translation?.content || '',
        })
      }

      return response.redirect().toRoute('admin.pages.index')
    } catch (error) {
      console.error('Error:', error) // 記錄錯誤
      if (error.messages) {
        return response.badRequest(error.messages)
      }
      throw error
    }
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
    const id = Number(params.id)
    const page = await Page.findOrFail(id)
    await page.load('children')

    try {
      // 驗證輸入
      const formData = request.all()
      formData.isActive = !!formData.isActive
      if (formData.parentId === '' || formData.parentId === undefined) {
        formData.parentId = null
      }
      console.log('formData--', formData)
      // For first level pages: ignore submitted type and use original value
      if (page.parentId === null) {
        formData.type = page.type // Force use original type
        formData.parentId = null // Force keep as null
      }

      if (page.children?.length > 0) {
        formData.type = page.type // Force use original type
        formData.parentId = page.parentId // Force keep as original parentId
      }

      const data = await pageValidator.validate(formData)
      const validatedData = {
        ...data,
      }
      console.log('data--', data.parentId)
      // 檢查權限
      if (data.type !== page.type && !this.#pagePolicy.canChangeType(page)) {
        return response.forbidden({ error: 'Cannot change type of this page' })
      }

      if (data.parentId !== page.parentId && !this.#pagePolicy.canChangeParent(page)) {
        return response.forbidden({ error: 'Cannot change parent of this page' })
      }

      // 如果要改變父頁面，檢查新父頁面是否合法
      if (data.parentId) {
        const parentPage = await Page.findOrFail(data.parentId)
        if (parentPage.type !== data.type) {
          return response.status(422).send({ error: 'Parent page type does not match' })
        }
        if (!this.#pagePolicy.isValidParent(parentPage)) {
          return response.unprocessableEntity({ error: 'Invalid parent page' })
        }
      }
      console.log('validatedData--', validatedData)
      // 更新翻譯
      for (const [locale, translation] of Object.entries(data.translations)) {
        await PageTranslation.updateOrCreate(
          { pageId: page.id, locale: this.formatLocale(locale) },
          {
            title: translation?.title || '',
            content: translation?.content || '',
          }
        )
      }

      await page.merge(validatedData).save()
      return response.redirect().toRoute('admin.pages.show', { id: page.id })
    } catch (error) {
      if (error.messages) {
        return response.badRequest(error.messages)
      }
      throw error
    }
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

  private formatLocale(locale: string): string {
    return locale.replace('_', '-')
  }
}

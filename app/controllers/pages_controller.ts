import type { HttpContext } from '@adonisjs/core/http'
import Page from '#models/page'
import BaseController from './base_controller.js'

export default class PagesController extends BaseController {
  /**
   * Get pages with nested structure up to 3 levels
   */
  async getPageHierarchy({ params }: HttpContext) {
    const pages = await Page.query()
      .where('type', params.type)
      .whereNull('parent_id') // Get top level pages
      .preload('children', (childrenQuery) => {
        childrenQuery.preload('children') // Load grandchildren
      })
      .orderBy('order')

    return pages
  }

  /**
   * Get single page with its breadcrumb trail
   */
  async show(ctx: HttpContext) {
    // Get shared data
    await this.getSharedData(ctx)

    const page = await Page.query()
      .where('slug', ctx.params.slug)
      .preload('parent', (parentQuery) => {
        parentQuery.preload('parent') // Load grandparent
      })
      .firstOrFail()

    return ctx.view.render('pages/show', { page })
  }
}

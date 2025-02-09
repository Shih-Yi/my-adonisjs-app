import type { HttpContext } from '@adonisjs/core/http'
import Page from '#models/page'
import BaseController from './base_controller.js'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

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
  async show({ params, view, response }: HttpContext) {
    const page = await Page.query()
      .where('slug', params.slug)
      .preload('parent', (parentQuery) => {
        parentQuery.preload('parent') // Load grandparent
      })
      .where('is_active', true)
      .first()

    if (!page) {
      return response.redirect().toRoute('home')
    }

    // Get shared data
    await this.getSharedData({ view })

    const customTemplate = `pages/custom/${params.slug}`
    const templatePath = join(process.cwd(), 'resources/views', `${customTemplate}.edge`)

    return view.render('pages/show', {
      page,
      customTemplate: existsSync(templatePath) ? customTemplate : null,
    })
  }
}

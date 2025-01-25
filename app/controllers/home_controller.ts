import type { HttpContext } from '@adonisjs/core/http'
import Page from '#models/page'

export default class HomeController {
  async index({ view, i18n }: HttpContext) {
    // Get navigation structure for all page types
    const navigation = await Page.getNavigation()

    return view.render('pages/home', {
      title: i18n.t('messages.home.title'),
      navigation,
      type: Page.PAGE_TYPES,
    })
  }
}

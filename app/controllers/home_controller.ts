import type { HttpContext } from '@adonisjs/core/http'
import PagesController from './pages_controller.js'

export default class HomeController {
  async index({ view, i18n }: HttpContext) {
    // Get navigation structure for all page types
    const navigation = await new PagesController().getNavigation()

    return view.render('pages/home', {
      title: i18n.t('messages.home.title'),
      navigation,
    })
  }
}

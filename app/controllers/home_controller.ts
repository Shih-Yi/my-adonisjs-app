import type { HttpContext } from '@adonisjs/core/http'
import BaseController from './base_controller.js'

export default class HomeController extends BaseController {
  async index(ctx: HttpContext) {
    // Get shared data
    await this.getSharedData(ctx)

    return ctx.view.render('pages/home', {
      title: ctx.i18n.t('messages.home.title'),
    })
  }
}

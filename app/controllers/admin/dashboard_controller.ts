import type { HttpContext } from '@adonisjs/core/http'

export default class DashboardController {
  public async dashboard({ view }: HttpContext) {
    return view.render('admin.dashboard')
  }
}

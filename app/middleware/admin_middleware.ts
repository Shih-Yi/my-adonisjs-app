import { HttpContext } from '@adonisjs/core/http'
import { NextFn } from '@adonisjs/core/types/http'

export default class AdminMiddleware {
  async handle({ auth, response }: HttpContext, next: NextFn) {
    if (auth.user?.isAdmin) {
      await next()
    } else {
      response.unauthorized('Admin access required!!!')
    }
  }
}

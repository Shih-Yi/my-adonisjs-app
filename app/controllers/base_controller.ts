import type { HttpContext } from '@adonisjs/core/http'
import Page from '#models/page'

export default class BaseController {
  protected async getSharedData(ctx: HttpContext) {
    // Get navigation structure
    const navigation = await Page.getNavigation()

    // Set shared view variables
    ctx.view.share({
      navigation,
      pageType: Page.PAGE_TYPES,
      // Other shared data...
    })
  }
}

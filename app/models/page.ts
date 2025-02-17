import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  hasMany,
  beforeSave,
  beforeCreate,
} from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import string from '@adonisjs/core/helpers/string'
import PageTranslation from './page_translation.js'

// Define PageType outside the class
const PAGE_TYPE_VALUES = ['about', 'im_new', 'whats_on', 'connect', 'library'] as const
type PageType = (typeof PAGE_TYPE_VALUES)[number]

export default class Page extends BaseModel {
  static readonly PAGE_TYPES = PAGE_TYPE_VALUES

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare parentId: number | null

  @column()
  declare type: PageType

  @column()
  declare title: string

  @column()
  declare slug: string

  @column()
  declare content: string | null

  @column()
  declare order: number

  @column()
  declare isActive: boolean

  @column()
  declare metaTitle: string | null

  @column()
  declare metaDescription: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => Page, { foreignKey: 'parentId' })
  declare parent: BelongsTo<typeof Page>

  @hasMany(() => Page, { foreignKey: 'parentId' })
  declare children: HasMany<typeof Page>

  @hasMany(() => PageTranslation)
  declare translations: HasMany<typeof PageTranslation>

  @beforeSave()
  public static async generateSlug(page: Page) {
    if (page.title && !page.slug) {
      // Convert title to slug format
      // "About Our Church" -> "about-our-church"
      page.slug = string.dashCase(page.title)
    }
  }

  @beforeCreate()
  public static async setOrder(page: Page) {
    const count = await Page.query().count('*').first()

    // new page order = total pages + 1
    page.order = Number(count?.$extras.count ?? 0) + 1
  }

  /**
   * Get navigation structure for all page types
   */
  static async getNavigation(): Promise<Page[]> {
    // get all first level pages
    const allFirstLevelPages = await this.query()
      .whereNull('parent_id')
      .preload('children', (childrenQuery) => {
        childrenQuery
          .preload('children', (grandchildrenQuery) => {
            grandchildrenQuery.orderBy('order', 'asc')
          })
          .orderBy('order', 'asc')
      })
      .orderBy('order', 'asc')

    const navigation = allFirstLevelPages.sort((a, b) => a.order - b.order)
    // sort all first level pages by order
    return navigation
  }

  // 方便取得特定語言的翻譯
  async getTranslation(locale: string) {
    return await PageTranslation.query().where('page_id', this.id).where('locale', locale).first()
  }
}

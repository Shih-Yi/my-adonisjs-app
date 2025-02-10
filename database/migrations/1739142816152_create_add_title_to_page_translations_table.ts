import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'page_translations'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('title').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('title')
    })
  }
}

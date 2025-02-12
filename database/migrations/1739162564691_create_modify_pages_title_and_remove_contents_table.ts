import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pages'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('title')
      table.dropColumn('content')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('title').nullable().alter()
      table.text('content').nullable()
    })
  }
}

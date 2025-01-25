import { DateTime } from 'luxon'
import { BaseModel, column, beforeSave } from '@adonisjs/lucid/orm'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email', 'username'],
  passwordColumnName: 'password',
})

export default class AdminUser extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare username: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare name: string | null

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: false })
  declare lastLoginAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  async verifyPassword(plainPassword: string) {
    return await hash.verify(this.password, plainPassword)
  }

  @beforeSave()
  static async hashPassword(adminUser: AdminUser) {
    if (adminUser.$dirty.password) {
      if (adminUser.password.length < 8 || adminUser.password.length > 16) {
        throw new Error('Password must be between 8 and 16 characters')
      }
      adminUser.password = await hash.make(adminUser.password)
    }
  }
}

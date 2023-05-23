import type { Client } from 'discord.js'
import log4js, { Logger } from 'log4js'
import assert from 'node:assert'

const countSingleClientUsers = async (client: Client): Promise<string[]> => {
  const guildMembers = await Promise.all(client.guilds.cache.map((guild) => guild.members.fetch()))
  const users = guildMembers.map((members) => [
    ...members.mapValues((member) => member.user.id).values(),
  ])

  return users.flat(2)
}

export class CountManager {
  #guildCount: number | undefined = undefined
  #guildCountCacheTime = 0
  #userCount: number | undefined = undefined
  #userCountCacheTime = 0

  logger: Logger

  constructor(public readonly client: Client) {
    this.logger = log4js.getLogger('counts')
  }

  async countGuilds(): Promise<number> {
    if (!this.#guildCount) {
      this.#guildCount = await this.#countGuilds()
      this.#guildCountCacheTime = Date.now()
      return this.#guildCount
    }

    if (Date.now() - this.#guildCountCacheTime > 5 * 60_000) {
      // return now but update in the background
      this.#countGuilds().then((v) => {
        this.#guildCount = v
        this.#guildCountCacheTime = Date.now()
      })
    }

    return this.#guildCount
  }

  async #countGuilds(): Promise<number> {
    const shard = this.client.shard

    if (shard == null) {
      const size = this.client.guilds.cache.size
      this.logger.debug(`UPDATE guilds ${size}`)
      return size
    }

    const guilds = await shard.fetchClientValues('guilds.cache.size')

    assert(
      Array.isArray(guilds) && guilds.every((guild) => typeof guild === 'number'),
      'guilds is not an array of numbers'
    )

    const count = (guilds as number[]).reduce((a, b) => a + b, 0)
    this.logger.debug(`UPDATE guilds ${count}`)
    return count
  }

  async countUsers(): Promise<number> {
    if (!this.#userCount) {
      this.#userCount = await this.#countUsers()
      this.#userCountCacheTime = Date.now()
      return this.#userCount
    }

    if (Date.now() - this.#userCountCacheTime > 5 * 60_000) {
      // return now but update in the background
      this.#countUsers().then((v) => {
        this.#userCount = v
        this.#userCountCacheTime = Date.now()
      })
    }

    return this.#userCount
  }

  async #countUsers(): Promise<number> {
    const shard = this.client.shard

    if (shard == null) {
      const users = await countSingleClientUsers(this.client)
      const size = new Set(users).size
      this.logger.debug(`UPDATE users ${size}`)
      return size
    }

    const users = await shard.broadcastEval((client) => countSingleClientUsers(client))

    const count = new Set(users.flat(1)).size
    this.logger.debug(`UPDATE users ${count}`)
    return count
  }

  async update(): Promise<void> {
    this.logger.debug('UPDATE all')
    await Promise.all([this.countGuilds(), this.countUsers()])
  }
}

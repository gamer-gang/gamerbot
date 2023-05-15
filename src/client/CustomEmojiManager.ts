import { GuildEmoji } from 'discord.js'
import { Logger } from 'log4js'
import env from '../env.js'
import { GamerbotClient } from './GamerbotClient.js'

export class CustomEmojiManager {
  #logger: Logger
  emojis = new Map<string, GuildEmoji>()

  constructor(public client: GamerbotClient) {
    this.#logger = this.client.getLogger('emoji')
  }

  async populateEmojis() {
    if (this.emojis.size !== 0) return

    if (!env.MEDIA_SERVER_ID) {
      this.#logger.warn("MEDIA_SERVER_ID not set, can't populate custom emojis")
      return
    }

    const guild = await this.client.guilds.fetch(env.MEDIA_SERVER_ID)
    const emojis = await guild.emojis.fetch()

    for (const emoji of emojis.values()) {
      if (!emoji.name) continue
      this.emojis.set(emoji.name, emoji)
      this.#logger.trace(`Loaded emoji ${emoji.name} (${emoji.id})`)
    }

    this.#logger.info(`Loaded ${this.emojis.size} custom emojis`)
  }

  get(name: string): GuildEmoji | undefined {
    return this.emojis.get(name)
  }

  getString(name: string, fallback?: string): string | undefined {
    const emoji = this.get(name)
    if (!emoji) return fallback
    return emoji.toString()
  }
}

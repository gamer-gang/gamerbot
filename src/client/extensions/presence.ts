import type { PresenceData } from 'discord.js'
import { GamerbotClient } from '../GamerbotClient.js'
import { ClientExtension } from './_extension.js'

export default class PresenceExtension extends ClientExtension {
  static cooldown = 5000

  #presence: PresenceData = {}
  needsUpdate = false
  destroyed = false
  #worker?: NodeJS.Timeout

  constructor(client: GamerbotClient) {
    super(client, 'presence')
  }

  async onReady(): Promise<void> {
    this.#worker = setInterval(this.work.bind(this), 5000)
  }

  work(): void {
    if (this.needsUpdate) {
      this.client.user?.setPresence(this.presence)
      this.needsUpdate = false
    }
  }

  destroy(): void {
    this.destroyed = true
    if (this.#worker) {
      clearInterval(this.#worker)
    }
  }

  get presence(): PresenceData {
    return this.#presence
  }

  set presence(data: PresenceData) {
    this.#presence = data
    this.needsUpdate = true
  }
}

import type { Client, PresenceData } from 'discord.js'

export class PresenceManager {
  static cooldown = 5000

  #presence: PresenceData = {}
  #needsUpdate = false
  #destroyed = false
  worker: NodeJS.Timeout

  constructor(client: Client) {
    this.worker = setInterval(() => {
      if (this.#needsUpdate) {
        client.user?.setPresence(this.presence)
        this.#needsUpdate = false
      }
    }, 5000)
  }

  destroy(): void {
    this.#destroyed = true
    clearInterval(this.worker)
  }

  get destroyed(): boolean {
    return this.#destroyed
  }

  get needsUpdate(): boolean {
    return this.#needsUpdate
  }

  get presence(): PresenceData {
    return this.#presence
  }

  set presence(data: PresenceData) {
    this.#presence = data
    this.#needsUpdate = true
  }
}

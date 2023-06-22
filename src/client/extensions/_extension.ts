import { Message } from 'discord.js'
import { Logger } from 'log4js'
import { GamerbotClient } from '../GamerbotClient.js'

export abstract class ClientExtension {
  logger: Logger
  constructor(public readonly client: GamerbotClient, public readonly name: string) {
    if (this.onReady) {
      client.on('ready', this.onReady.bind(this))
    }
    if (this.onMessageCreate) {
      client.on('messageCreate', this.onMessageCreate.bind(this))
    }
    this.logger = client.getLogger(name)
  }

  onReady?(): Promise<void>
  onMessageCreate?(message: Message): Promise<void>
}

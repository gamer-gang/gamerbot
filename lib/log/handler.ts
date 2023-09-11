import type { ClientEvents, Guild } from 'discord.js'
import type { GamerbotClient } from '../client/GamerbotClient.js'
import { Embed } from '../util/embed.js'

interface LogHandlerContext {
  readonly client: GamerbotClient
  readonly guild: Guild
  readonly timestamp: Date
}

interface ClientLogHandlerDef<T extends keyof ClientEvents> {
  event: T
  run: (context: LogHandlerContext, ...args: ClientEvents[T]) => Promise<Embed>
}

export type ClientLogHandler<T extends keyof ClientEvents> = ClientLogHandlerDef<T>

export function handler<T extends keyof ClientEvents>(
  def: ClientLogHandlerDef<T>
): ClientLogHandler<T> {
  return def
}

handler({
  event: 'channelCreate',
  async run(context, channel) {
    return new Embed({
      title: 'Channel Created',
      description: `${channel.name} was created.`,
    })
  },
})

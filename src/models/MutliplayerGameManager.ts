import { GuildMember, TextChannel } from 'discord.js'
import { CommandContext } from '../commands/context.js'
import { MultiplayerGame } from './MultiplayerGame.js'

type Constructor<T> = new (
  context: CommandContext,
  channel: TextChannel,
  creator: GuildMember,
  ...args: unknown[]
) => T

export class MultiplayerGameManager<T extends MultiplayerGame> {
  type: Constructor<T>
  constructor(type: Constructor<T>) {
    this.type = type
  }

  games = new Map<string, T>()

  get(channelId: string): T | undefined {
    return this.games.get(channelId)
  }

  async create(context: CommandContext, channel: TextChannel, creator: GuildMember): Promise<T> {
    const game = new this.type(context, channel, creator)
    this.games.set(channel.id, game)

    game.players.push(creator)

    return game
  }

  delete(channelId: string): void {
    this.games.delete(channelId)
  }
}

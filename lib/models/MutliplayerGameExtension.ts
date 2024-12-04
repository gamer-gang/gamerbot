import { GuildMember, TextChannel } from 'discord.js'
import { GamerbotClient } from '../client/GamerbotClient.js'
import { ClientExtension } from '../client/extensions/_extension.js'
import { CommandContext } from '../commands/context.js'
import { MultiplayerGame } from './MultiplayerGame.js'

type Constructor<T> = new (
  context: CommandContext,
  channel: TextChannel,
  creator: GuildMember,
  ...args: unknown[]
) => T

export class MultiplayerGameExtension<T extends MultiplayerGame> extends ClientExtension {
  constructor(
    client: GamerbotClient,
    public readonly type: Constructor<T>,
    public readonly name: string
  ) {
    super(client, name)
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

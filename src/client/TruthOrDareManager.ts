import { TODGameMode, TODPlayerOrder, TruthOrDareConfig } from '@prisma/client'
import { GuildMember, TextChannel } from 'discord.js'
import { CommandContext } from '../commands/context.js'
import { prisma } from '../prisma.js'
import { TruthOrDareGame } from './TruthOrDareGame.js'

export enum TODType {
  Truth = 'truth',
  Dare = 'dare',
}

export enum TODGameState {
  Preparing,
  ChoosingTarget,
  Asking,
  Responding,
  Paused,
  Finished,
}

export type TODConfig = Omit<TruthOrDareConfig, 'guildId' | 'createdAt' | 'updatedAt'>

export const truthOrDareConfigDefault = (): TODConfig => ({
  autoRole: true,
  autoPin: true,
  askTimeout: 5 * 60 * 1000,
  respondTimeout: 5 * 60 * 1000,
  prepareTimeout: 2 * 60 * 1000,
  maxPlayers: 15,
  rounds: 3,
  playerOrder: TODPlayerOrder.Random,
  gameMode: TODGameMode.Normal,
})

export class TruthOrDareManager {
  games = new Map<string, TruthOrDareGame>()

  get(channelId: string): TruthOrDareGame | undefined {
    return this.games.get(channelId)
  }

  async create(
    context: CommandContext,
    channel: TextChannel,
    creator: GuildMember
  ): Promise<TruthOrDareGame> {
    const config = await prisma.truthOrDareConfig.findUniqueOrThrow({
      where: { guildId: channel.guild.id },
    })

    const game = new TruthOrDareGame(context, channel, creator, config)
    this.games.set(channel.id, game)

    game.players.push(creator)

    return game
  }

  delete(channelId: string): void {
    this.games.delete(channelId)
  }

  async getConfig(guildId: string): Promise<TruthOrDareConfig> {
    const config = await prisma.truthOrDareConfig.findUniqueOrThrow({ where: { guildId } })
    return config
  }

  async setConfig(guildId: string, config: TODConfig): Promise<void> {
    await prisma.truthOrDareConfig.update({ where: { guildId }, data: config })
  }

  async resetConfig(guildId: string): Promise<void> {
    await prisma.truthOrDareConfig.update({ where: { guildId }, data: truthOrDareConfigDefault() })
  }

  async ensureConfig(guildId: string): Promise<void> {
    await prisma.truthOrDareConfig.upsert({
      where: { guildId },
      create: { guildId, ...truthOrDareConfigDefault() },
      update: {},
    })
  }

  async deleteConfig(guildId: string): Promise<void> {
    await prisma.truthOrDareConfig.delete({ where: { guildId } })
  }
}

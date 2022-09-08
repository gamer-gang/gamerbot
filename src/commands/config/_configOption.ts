/* eslint-disable @typescript-eslint/indent */
import type { Config, Prisma } from '@prisma/client'
import type { APIInteractionDataResolvedChannel, APIRole } from 'discord-api-types/v9.js'
import type {
  ApplicationCommandOptionChoiceData,
  CommandInteraction,
  Guild,
  GuildChannel,
  GuildMember,
  Role,
  ThreadChannel,
  User,
} from 'discord.js'
import { ApplicationCommandOptionType } from 'discord.js'
import assert from 'node:assert'
import type { CommandResult } from '../command.js'
import type { CommandContext } from '../context.js'

export type ConfigValueType = Exclude<
  ApplicationCommandOptionType,
  ApplicationCommandOptionType.Subcommand | ApplicationCommandOptionType.SubcommandGroup
>

export type CommandContextWithGuild = CommandContext & {
  interaction: CommandInteraction & {
    guild: Guild
    channel: GuildChannel
    member: GuildMember
  }
}

interface ConfigOptionDef<T extends ConfigValueType> {
  displayName: string
  internalName: string
  description: string
  type: T
  choices?: T extends
    | ApplicationCommandOptionType.String
    | ApplicationCommandOptionType.Number
    | ApplicationCommandOptionType.Integer
    ? ApplicationCommandOptionChoiceData[]
    : never

  handle: (
    context: CommandContextWithGuild,
    helpers: ConfigOptionHelpers<T>
  ) => Promise<CommandResult>
}

export type ConfigOption<T extends ConfigValueType> = ConfigOptionDef<T>

type CommandOptionTypeof<V extends ConfigValueType> = V extends ApplicationCommandOptionType.String
  ? string
  : V extends ApplicationCommandOptionType.Integer | ApplicationCommandOptionType.Number
  ? number
  : V extends ApplicationCommandOptionType.Boolean
  ? boolean
  : V extends ApplicationCommandOptionType.User
  ? User
  : V extends ApplicationCommandOptionType.Channel
  ? GuildChannel | ThreadChannel | APIInteractionDataResolvedChannel
  : V extends ApplicationCommandOptionType.Role
  ? Role | APIRole
  : V extends ApplicationCommandOptionType.Mentionable
  ? User | Role | GuildChannel
  : never

export interface ConfigOptionHelpers<V extends ConfigValueType> {
  getValue: () => CommandOptionTypeof<V> | null
  getConfig: () => Promise<Config>
  updateConfig: (data: Prisma.ConfigUpdateArgs['data']) => Promise<Config>
}

export const helpers = <T extends ConfigValueType>(
  context: CommandContextWithGuild
): ConfigOptionHelpers<T> => {
  return {
    getValue: () => {
      const option = context.options.get('value')

      if (option == null) return null

      if (
        [
          ApplicationCommandOptionType.Boolean,
          ApplicationCommandOptionType.Integer,
          ApplicationCommandOptionType.Number,
          ApplicationCommandOptionType.String,
        ].includes(option.type)
      ) {
        return (option.value as CommandOptionTypeof<T>) ?? null
      }

      return ((option.channel ?? option.role ?? option.user) as CommandOptionTypeof<T>) ?? null
    },

    async getConfig() {
      const config = await context.prisma.config.findFirst({
        where: { guildId: context.interaction.guild.id },
      })
      assert(config, 'config not found')
      return config
    },

    async updateConfig(data: Prisma.ConfigUpdateArgs['data']) {
      return await context.prisma.config.update({
        where: { guildId: context.interaction.guild.id },
        data,
      })
    },
  }
}

export function configOption<T extends ConfigValueType>(def: ConfigOptionDef<T>): ConfigOption<T> {
  return def
}

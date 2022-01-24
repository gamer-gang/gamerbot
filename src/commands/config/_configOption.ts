/* eslint-disable @typescript-eslint/indent */
import { Config, Prisma } from '@prisma/client'
import { APIInteractionDataResolvedChannel, APIRole } from 'discord-api-types'
import {
  ApplicationCommandOptionChoice,
  ApplicationCommandOptionType,
  CommandInteraction,
  Guild,
  GuildChannel,
  GuildMember,
  Role,
  ThreadChannel,
  User,
} from 'discord.js'
import assert from 'node:assert'
import { CommandResult } from '../command.js'
import { CommandContext } from '../context.js'

export type ConfigValueType = Exclude<
  ApplicationCommandOptionType,
  'SUB_COMMAND' | 'SUB_COMMAND_GROUP'
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
  choices?: T extends 'STRING' | 'INTEGER' | 'NUMBER' ? ApplicationCommandOptionChoice[] : never

  handle: (
    context: CommandContextWithGuild,
    helpers: ConfigOptionHelpers<T>
  ) => Promise<CommandResult>
}

export type ConfigOption<T extends ConfigValueType> = ConfigOptionDef<T>

type CommandOptionTypeof<V extends ConfigValueType> = V extends 'STRING'
  ? string
  : V extends 'INTEGER'
  ? number
  : V extends 'BOOLEAN'
  ? boolean
  : V extends 'USER'
  ? User
  : V extends 'CHANNEL'
  ? GuildChannel | ThreadChannel | APIInteractionDataResolvedChannel
  : V extends 'ROLE'
  ? Role | APIRole
  : V extends 'MENTIONABLE'
  ? User | Role | GuildChannel
  : V extends 'NUMBER'
  ? number
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

      if (['BOOLEAN', 'INTEGER', 'NUMBER', 'STRING'].includes(option.type)) {
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

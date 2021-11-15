import {
  ApplicationCommandOptionData,
  CommandInteraction,
  ContextMenuInteraction,
  Guild,
  GuildChannel,
  GuildMember,
  PermissionString,
} from 'discord.js'
import { CommandContext, MessageCommandContext, UserCommandContext } from './commands/context.js'

export interface GuildRequired {
  guild: Guild
  channel: GuildChannel
  member: GuildMember
}

interface BaseCommand {
  name: string
  guildOnly?: boolean
  logUsage?: boolean
  userPermissions?: PermissionString[]
  botPermissions?: PermissionString[]
}

export interface ChatCommandDefNoGuild extends BaseCommand {
  description: string
  options?: ApplicationCommandOptionData[]
  guildOnly?: false
  run: (context: CommandContext) => Promise<unknown>
}

export interface UserCommandDefNoGuild extends BaseCommand {
  guildOnly?: false
  run: (context: UserCommandContext) => Promise<unknown>
}

export interface MessageCommandDefNoGuild extends BaseCommand {
  guildOnly?: false
  run: (context: MessageCommandContext) => Promise<unknown>
}

export interface ChatCommandDefGuildOnly extends BaseCommand {
  description: string
  options?: ApplicationCommandOptionData[]
  guildOnly: true
  run: (
    context: CommandContext & {
      interaction: CommandInteraction & GuildRequired
    }
  ) => Promise<unknown>
}

export type ChatCommandDef = ChatCommandDefNoGuild | ChatCommandDefGuildOnly

export interface UserCommandDefGuildOnly extends BaseCommand {
  guildOnly: true
  run: (
    context: UserCommandContext & {
      interaction: ContextMenuInteraction & GuildRequired
    }
  ) => Promise<unknown>
}

export type UserCommandDef = UserCommandDefNoGuild | UserCommandDefGuildOnly

export interface MessageCommandDefGuildOnly extends BaseCommand {
  guildOnly: true
  run: (
    context: MessageCommandContext & {
      interaction: ContextMenuInteraction & GuildRequired
    }
  ) => Promise<unknown>
}

export type MessageCommandDef = MessageCommandDefNoGuild | MessageCommandDefGuildOnly

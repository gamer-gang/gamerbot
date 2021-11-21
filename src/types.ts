/* eslint-disable @typescript-eslint/indent */
import {
  ApplicationCommandOptionChoice,
  ApplicationCommandOptionData,
  AutocompleteInteraction,
  CommandInteraction,
  ContextMenuInteraction,
  Guild,
  GuildChannel,
  GuildMember,
  Interaction,
  PermissionString,
} from 'discord.js'
import {
  BaseContext,
  CommandContext,
  MessageCommandContext,
  UserCommandContext,
} from './commands/context.js'

interface GuildRequired<C extends BaseContext, I extends Interaction> {
  guildOnly: true
  run: (
    context: C & {
      interaction: I & {
        guild: Guild
        channel: GuildChannel
        member: GuildMember
      }
    }
  ) => Promise<unknown>
}

interface GuildOptional<C extends BaseContext> {
  guildOnly?: false
  run: (context: C) => Promise<unknown>
}

type CommandType<
  C extends BaseContext,
  I extends Interaction,
  // eslint-disable-next-line @typescript-eslint/ban-types
  O = {}
> = BaseCommand & O & (GuildRequired<C, I> | GuildOptional<C>)

interface BaseCommand {
  name: string
  guildOnly?: boolean
  logUsage?: boolean
  userPermissions?: PermissionString[]
  botPermissions?: PermissionString[]
}

export type ChatCommandDef = CommandType<
  CommandContext,
  CommandInteraction,
  {
    description: string
    options?: ApplicationCommandOptionData[]
    autocomplete?: (
      interaction: AutocompleteInteraction
    ) => Promise<ApplicationCommandOptionChoice[]>
  }
>

export type UserCommandDef = CommandType<UserCommandContext, ContextMenuInteraction>

export type MessageCommandDef = CommandType<MessageCommandContext, ContextMenuInteraction>

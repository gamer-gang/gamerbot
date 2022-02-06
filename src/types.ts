/* eslint-disable @typescript-eslint/indent */
import {
  ApplicationCommandOptionChoice,
  ApplicationCommandOptionData,
  ApplicationCommandType,
  AutocompleteInteraction,
  CommandInteraction,
  ContextMenuInteraction,
  Guild,
  GuildChannel,
  GuildMember,
  Interaction,
  PermissionString,
} from 'discord.js'
import type { CommandResult } from './commands/command.js'
import {
  BaseContext,
  CommandContext,
  MessageCommandContext,
  UserCommandContext,
} from './commands/context.js'

export interface GuildRequired<Context extends BaseContext, Int extends Interaction> {
  /**
   * Whether this command is allowed to be used outside a guild (e.g. in a DM).
   *
   * @default false
   */
  guildOnly: true
  run: (
    context: Context & {
      interaction: Int & {
        guild: Guild
        channel: GuildChannel
        member: GuildMember
      }
    }
  ) => Promise<CommandResult>
}

export interface GuildOptional<C extends BaseContext> {
  /**
   * Whether this command is allowed to be used outside a guild (e.g. in a DM).
   *
   * @default false
   */
  guildOnly?: false
  run: (context: C) => Promise<CommandResult>
}

type CommandType<
  Context extends BaseContext,
  Int extends Interaction,
  // eslint-disable-next-line @typescript-eslint/ban-types
  Options = {}
> = BaseCommand & Options & (GuildRequired<Context, Int> | GuildOptional<Context>)

interface BaseCommand {
  /**
   * Name of the command.
   *
   * For slash commands, this name is used as /commandname (lowercase and no spaces required).
   *
   * For context menu commands, this name is used as the context menu entry (uppercase and spaces
   * preferred).
   */
  name: string
  /**
   * Description of the command.
   */
  description?: string
  /**
   * Whether this command is allowed to be used outside a guild (e.g. in a DM).
   *
   * @default false
   */
  guildOnly?: boolean
  /**
   * Whether usages of this command should be available as a log event.
   *
   * @default false
   */
  logUsage?: boolean
  /**
   * Array of required permissions for the executor of this command. Command will not be executed if
   * the executor does not have all of these permissions.
   */
  userPermissions?: PermissionString[]
  /**
   * Array of permissions for the bot for this command. Command will not be executed if the bot does
   * not have these permissions.
   */
  botPermissions?: PermissionString[]
  /**
   * Longer description of the command. Markdown is supported.
   *
   * Defaults to the shorter description if not provided.
   */
  longDescription?: string
  /**
   * Example usages of the command.
   */
  examples?: CommandExample[]
}

export interface CommandExample {
  /**
   * Options given to the command.
   */
  options: { [key: string]: string | number | { mention: string } | null | boolean }
  /**
   * Description of what these options do. Markdown is supported.
   */
  description?: string
}

export type ChatCommandDef = CommandType<
  CommandContext,
  CommandInteraction,
  {
    /**
     * Description of the command.
     */
    description: string
    /**
     * Options for the command.
     *
     * Autocomplete events will be handled by this command's `autocomplete` method.
     */
    options?: ApplicationCommandOptionData[]
    /**
     * Autocomplete handler for this command; required if any of the command's options are
     * autocompleteable.
     */
    autocomplete?: (
      interaction: AutocompleteInteraction
    ) => Promise<ApplicationCommandOptionChoice[]>
  }
>

export type UserCommandDef = CommandType<UserCommandContext, ContextMenuInteraction>

export type MessageCommandDef = CommandType<MessageCommandContext, ContextMenuInteraction>

export interface DocsJson {
  version: string
  commands: Array<{
    name: string
    type: ApplicationCommandType
    description: string
    longDescription: string
    examples: CommandExample[]
    options: ApplicationCommandOptionData[]
    guildOnly: boolean
    logUsage: boolean
    userPermissions: PermissionString[]
    botPermissions: PermissionString[]
  }>
}

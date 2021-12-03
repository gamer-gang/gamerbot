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
  /**
   * Whether this command is allowed to be used outside a guild (e.g. in a DM).
   *
   * @default false
   */
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
  /**
   * Whether this command is allowed to be used outside a guild (e.g. in a DM).
   *
   * @default false
   */
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

import {
  ApplicationCommandOptionData,
  ApplicationCommandOptionType,
  ApplicationCommandSubCommandData,
  ApplicationCommandType,
  InteractionType,
} from 'discord.js'
import assert from 'node:assert'
import type {
  ChatCommandDef,
  CommandDefinitionType,
  CommandObjectType,
  ContextType,
  MessageCommandDef,
  UserCommandDef,
} from '../types.js'
import { isChatCommand } from '../util.js'

export type ChatCommand = Required<ChatCommandDef> & { type: ApplicationCommandType.ChatInput }
export type UserCommand = Required<UserCommandDef> & { type: ApplicationCommandType.User }
export type MessageCommand = Required<MessageCommandDef> & { type: ApplicationCommandType.Message }

export type Command = ChatCommand | UserCommand | MessageCommand

export enum CommandResult {
  /**
   * Denotes successful execution of the command.
   */
  Success,
  /**
   * Denotes a failure to execute the command due to invalid user input.
   */
  Invalid,
  /**
   * Denotes a failure to fulfill execution of the command. Typicall an error that is not caused by
   * the user, such as a failed request to an external API, logic error, etc.
   */
  Failure,
  /**
   * Denotes a failure to execute the command due to the user not having the required permissions.
   */
  Unauthorized,
  /**
   * Denotes a failure to execute the command because a resource was not found.
   */
  NotFound,
}

const normalizeOptions = (
  options: readonly ApplicationCommandOptionData[] | undefined
): ApplicationCommandOptionData[] | undefined => {
  if (options == null) {
    return undefined
  }

  const base: ApplicationCommandOptionData = {
    type: undefined as never,
    name: undefined as never,
    description: undefined as never,
    required: undefined,
    autocomplete: undefined,
    choices: undefined,
    channelTypes: undefined,
    minValue: undefined,
    maxValue: undefined,
    options: undefined,
  }

  return options.map((option) => {
    if (option.type === ApplicationCommandOptionType.SubcommandGroup) {
      return {
        ...(base as object),
        ...option,
        type: option.type,
        options: normalizeOptions(option.options) as ApplicationCommandSubCommandData[],
      }
    }

    if (option.type === ApplicationCommandOptionType.Subcommand) {
      return {
        ...(base as object),
        ...option,
        type: option.type,
        options: normalizeOptions(option.options) as ApplicationCommandSubCommandData['options'],
      }
    }

    return {
      ...(base as object),
      ...option,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      required: (option as any).required ?? false,
    }
  })
}

function command<T extends ApplicationCommandType>(
  type: T,
  def: CommandDefinitionType[T]
): CommandObjectType[T] {
  const commandObj: CommandObjectType[T] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(def as any),
    options: isChatCommand(def) ? normalizeOptions(def.options) : undefined,
    type,
    guildOnly: def.guildOnly ?? false,
    logUsage: def.logUsage ?? false,
    userPermissions: def.userPermissions ?? [],
    botPermissions: def.botPermissions ?? [],
    autocomplete: isChatCommand(def) ? def.autocomplete : null,
  }

  if (commandObj.logUsage) {
    commandObj.run = (async (context: ContextType[T]) => {
      const { interaction } = context

      assert(interaction.type === InteractionType.ApplicationCommand)

      // TODO: log usage

      return await def.run(
        // @ts-expect-error we know the type
        context
      )
    }) as Command['run']
  }

  return commandObj
}

export default command

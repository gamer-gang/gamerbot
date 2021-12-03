import { ApplicationCommandType } from 'discord.js'
import assert from 'node:assert'
import { ChatCommandDef, MessageCommandDef, UserCommandDef } from '../types.js'
import { formatOptions, isChatCommand } from '../util.js'
import { CommandContext, MessageCommandContext, UserCommandContext } from './context.js'

export type ChatCommand = Required<ChatCommandDef> & { type: 'CHAT_INPUT' }
export type UserCommand = Required<UserCommandDef> & { type: 'USER' }
export type MessageCommand = Required<MessageCommandDef> & { type: 'MESSAGE' }

export type Command = ChatCommand | UserCommand | MessageCommand

function command(type: 'CHAT_INPUT', def: ChatCommandDef): ChatCommand
function command(type: 'USER', def: UserCommandDef): UserCommand
function command(type: 'MESSAGE', def: MessageCommandDef): MessageCommand
function command(
  type: ApplicationCommandType,
  def: ChatCommandDef | UserCommandDef | MessageCommandDef
): Command {
  const commandObj: Command = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(def as any),
    options: isChatCommand(def) ? def.options ?? [] : [],
    type: type as never,
    guildOnly: (def.guildOnly ?? false) as never,
    logUsage: def.logUsage ?? false,
    userPermissions: def.userPermissions ?? [],
    botPermissions: def.botPermissions ?? [],
    autocomplete: (isChatCommand(def) ? def.autocomplete : null) as never,
  }

  if (commandObj.logUsage) {
    commandObj.run = (async (
      context: CommandContext & UserCommandContext & MessageCommandContext
    ) => {
      const { interaction, options } = context

      assert(interaction.isCommand())

      context.client.logger.silly(`/${interaction.commandName} ${formatOptions(options.data)}`)
      await def.run(
        // @ts-expect-error guild types are not correct
        context
      )
    }) as Command['run']
  }

  return commandObj
}

export default command

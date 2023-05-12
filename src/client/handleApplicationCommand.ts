import * as Sentry from '@sentry/node'
import { ApplicationCommandType, Interaction, InteractionType } from 'discord.js'
import assert from 'node:assert'
import { CommandResult } from '../commands/command.js'
import { CommandContext, MessageCommandContext, UserCommandContext } from '../commands/context.js'
import { IS_DEVELOPMENT } from '../env.js'
import { prisma } from '../prisma.js'
import { hasPermissions } from '../util.js'
import { Embed } from '../util/embed.js'
import { formatOptions } from '../util/format.js'
import { ClientContext } from './ClientContext.js'
import type { GamerbotClient } from './GamerbotClient.js'

export default async function handleApplicationCommand(
  this: GamerbotClient,
  ctx: ClientContext,
  interaction: Extract<Interaction, { type: InteractionType.ApplicationCommand }>
) {
  const command = this.commands.get(interaction.commandName)

  if (command == null) {
    await interaction.reply({ embeds: [Embed.error('Command not found.')] })
    return
  }

  this.startSentry(interaction)

  ctx.transaction = Sentry.startTransaction({
    op: 'command',
    name:
      interaction.commandType === ApplicationCommandType.ChatInput
        ? `/${command.name}`
        : `${command.name} (context menu)`,
    tags: {
      command: command.name,
      command_type: ApplicationCommandType[interaction.commandType],
    },
  })

  let context
  if (command.type === ApplicationCommandType.User) {
    assert(command.type === interaction.commandType)
    context = new UserCommandContext(this, interaction, prisma)
    if (IS_DEVELOPMENT) {
      this.getLogger('command').debug(
        `/${interaction.commandName} target:${interaction.targetId} ${formatOptions(
          interaction.options.data
        )}`
      )
    }
  } else if (command.type === ApplicationCommandType.Message) {
    assert(command.type === interaction.commandType)
    context = new MessageCommandContext(this, interaction, prisma)
    if (IS_DEVELOPMENT) {
      this.getLogger('command').debug(
        `${interaction.commandName} target:${interaction.targetId} ${formatOptions(
          interaction.options.data
        )}`
      )
    }
  } else if (command.type === ApplicationCommandType.ChatInput) {
    assert(command.type === interaction.commandType)
    context = new CommandContext(this, interaction, prisma)

    if (IS_DEVELOPMENT) {
      this.getLogger('command').debug(
        `/${interaction.commandName} ${formatOptions(interaction.options.data)}`
      )
    }
  }

  const result = hasPermissions(interaction, command)
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await command.run(context as any)
    : CommandResult.Unauthorized

  const results: Record<CommandResult, Sentry.SpanStatusType> = {
    [CommandResult.Success]: 'ok',
    [CommandResult.Failure]: 'internal_error',
    [CommandResult.Unauthorized]: 'unauthenticated',
    [CommandResult.Invalid]: 'invalid_argument',
    [CommandResult.NotFound]: 'not_found',
  }

  ctx.transaction.setStatus(results[result] ?? ('unknown_error' satisfies Sentry.SpanStatusType))
}

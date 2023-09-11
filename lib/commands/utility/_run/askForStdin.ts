import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ComponentType,
} from 'discord.js'
import assert from 'node:assert'
import type { Runtime } from 'piston-client'
import { Embed } from '../../../util/embed.js'
import { CommandResult } from '../../command.js'
import type { CommandContext } from '../../context.js'

const askForStdin = async (
  context: CommandContext,
  runtime: Runtime
): Promise<string | CommandResult> => {
  const { interaction } = context

  const embed = new Embed({
    title: `Run code: ${runtime.language} v${runtime.version}`,
    description: 'Send your program input in a message or as a file.',
    footer: { text: 'Time limit: 5 minutes' },
  })

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder({
      label: 'Cancel',
      customId: 'cancel',
      style: ButtonStyle.Danger,
    })
  )

  const followUp = await interaction.followUp({
    embeds: [embed],
    components: [row],
  })

  assert(interaction.channel, 'Interaction has no channel')

  const result = await Promise.any([
    interaction.channel.awaitMessages({
      idle: 5 * 60_000,
      filter: (message) => message.author.id === interaction.user.id,
      max: 1,
      dispose: true,
      errors: [],
    }),
    interaction.channel
      .awaitMessageComponent({
        componentType: ComponentType.Button,
        idle: 5 * 60_000,
        filter: (component) =>
          component.customId === 'cancel' &&
          component.message.id === followUp.id &&
          component.user.id === interaction.user.id,
        dispose: true,
      })
      .catch(() => null),
  ])

  if (!result) {
    await interaction.editReply({
      embeds: [Embed.error('Code run cancelled.')],
      components: [],
    })
    return CommandResult.Success
  }

  if (result instanceof ButtonInteraction) {
    await result.update({
      embeds: [Embed.error('Code run cancelled.')],
      components: [],
    })
    return CommandResult.Success
  }

  if (!result.first()) {
    await interaction.followUp({
      embeds: [Embed.error('Timed out.')],
    })
    return CommandResult.Success
  }

  await interaction.editReply({
    embeds: [embed],
    components: [],
  })

  const message = result.first()!

  if (message.attachments.size > 0) {
    const attachment = message.attachments.first()!
    if (!attachment.contentType?.startsWith('text/')) {
      await interaction.followUp({
        embeds: [Embed.error('Only text attachments are supported.')],
      })
      return CommandResult.Success
    }

    return fetch(attachment.url).then((r) => r.text())
  }

  // check if the message is a code block
  const codeBlocks = message.content.match(/^```.*?\n((?:.|\n)*?)```$/)

  if (codeBlocks) {
    return codeBlocks[1].trim()
  }

  interaction.channel.messages.resolve(followUp.id)?.delete()

  return message.content
}

export default askForStdin

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
import { isValidCodeAttachment } from './util.js'

const askForCode = async (
  context: CommandContext,
  runtime: Runtime
): Promise<string | CommandResult> => {
  const { interaction } = context

  const embed = new Embed({
    title: `Run code: ${runtime.language} v${runtime.version}`,
    description:
      'Send your code to be run in a message, as a file, or as a URL to a gist (raw only, e.g. https:\\/\\/gist.githubusercontent.com/user/id/raw...).',
    footer: { text: 'Time limit: 5 minutes' },
  })

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder({
      label: 'Cancel',
      customId: 'cancel',
      style: ButtonStyle.Danger,
    })
  )

  await interaction.editReply({
    embeds: [embed],
    components: [row],
  })

  const replyId = await interaction.fetchReply().then((reply) => reply.id)

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
          component.message.id === replyId &&
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
    if (!isValidCodeAttachment(attachment)) {
      await interaction.followUp({
        embeds: [
          Embed.error('Only text attachments are supported.').setFooter({
            text: `Content type: ${attachment.contentType}`,
          }),
        ],
      })
      return CommandResult.Success
    }

    return await fetch(attachment.url).then((r) => r.text())
  }

  // check if the message is a code block
  const codeBlock = message.content.match(/^```.*?\n((?:.|\n)*?)```$/)
  const isGist = message.content.match(/^https?:\/\/gist\.githubusercontent\.com\/.+$/)
  const urlLike = message.content.match(/^https?:\/\/.*$/)

  if (codeBlock) {
    return codeBlock[1].trim()
  } else if (isGist) {
    return await fetch(message.content).then((r) => r.text())
  } else if (urlLike) {
    await interaction.followUp({
      embeds: [Embed.error('Invalid URL. Only raw gist URLs are supported.')],
    })
    return CommandResult.Success
  }

  return message.content
}

export default askForCode

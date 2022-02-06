import axios from 'axios'
import { ButtonInteraction, MessageActionRow, MessageButton } from 'discord.js'
import assert from 'node:assert'
import { Runtime } from 'piston-client'
import { Embed } from '../../../util/embed.js'
import { CommandResult } from '../../command.js'
import { CommandContext } from '../../context.js'

const ALLOWED_MIME_TYPES = ['video/MP2T; charset=utf-8']

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

  const row = new MessageActionRow({
    components: [
      new MessageButton({
        label: 'Cancel',
        customId: 'cancel',
        style: 'DANGER',
      }),
    ],
  })

  await interaction.editReply({
    embeds: [embed],
    components: [row],
  })

  const replyId = await interaction.fetchReply().then((reply) => reply.id)

  assert(interaction.channel, 'Interaction has no channel')

  const result = await Promise.any([
    interaction.channel.awaitMessages({
      idle: 1000 * 60 * 5, // 5 minutes
      filter: (message) => message.author.id === interaction.user.id,
      max: 1,
      dispose: true,
      errors: [],
    }),
    interaction.channel
      .awaitMessageComponent({
        componentType: 'BUTTON',
        idle: 1000 * 60 * 5, // 5 minutes
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
    if (
      attachment.contentType &&
      !attachment.contentType.startsWith('text/') &&
      !attachment.contentType.startsWith('application/') &&
      !ALLOWED_MIME_TYPES.includes(attachment.contentType)
    ) {
      await interaction.followUp({
        embeds: [
          Embed.error('Only text attachments are supported.').setFooter({
            text: `Content type: ${attachment.contentType}`,
          }),
        ],
      })
      return CommandResult.Success
    }

    return await axios
      .get(attachment.url, { responseType: 'text' })
      .then((response) => response.data)
  }

  // check if the message is a code block
  const codeBlock = message.content.match(/^```.*?\n((?:.|\n)*?)```$/)
  const isGist = message.content.match(/^https?:\/\/gist.githubusercontent.com\/.+$/)
  const urlLike = message.content.match(/^https?:\/\/.*$/)

  if (codeBlock) {
    return codeBlock[1].trim()
  } else if (isGist) {
    return await axios
      .get(message.content, { responseType: 'text' })
      .then((response) => response.data)
  } else if (urlLike) {
    await interaction.followUp({
      embeds: [Embed.error('Invalid URL. Only raw gist URLs are supported.')],
    })
    return CommandResult.Success
  }

  return message.content
}

export default askForCode

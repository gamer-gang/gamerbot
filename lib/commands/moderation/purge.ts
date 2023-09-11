import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js'
import assert from 'node:assert'
import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'
import { purgeTo } from './purgetohere.js'

const COMMAND_PURGE = command(ApplicationCommandType.ChatInput, {
  name: 'purge',
  description: 'Delete the last <n> messages, or delete all messages up to a message.',
  guildOnly: true,
  logUsage: true,
  botPermissions: ['ManageMessages'],
  userPermissions: ['ManageMessages'],
  examples: [
    {
      options: { n: 150 },
      description: 'Delete the last 150 messages in the current channel.',
    },
    {
      options: { to: '939727204823220225' },
      description:
        'Delete every message in the current channel up to the message with ID 939727204823220225.',
    },
  ],
  options: [
    {
      name: 'n',
      description: 'Number of messages to delete.',
      type: ApplicationCommandOptionType.Integer,
    },
    {
      name: 'to',
      description: 'Delete messages up to this message.',
      type: ApplicationCommandOptionType.String,
    },
  ],

  async run(context) {
    const { interaction, options } = context

    let n = options.getInteger('n')
    const to = options.getString('to')

    // if both n and to are specified or neither is specified, reply with an error
    if ((n != null && to != null) || (n == null && to == null)) {
      await interaction.reply(
        'You must specify either a number of messages to delete or a message to delete up to.'
      )
      return CommandResult.Success
    }

    if (n != null) {
      void interaction.reply({
        embeds: [Embed.info('Purging...')],
        ephemeral: true,
      })

      while (n > 0) {
        const deletable = Math.min(n, 200)
        const deleted = await interaction.channel.bulkDelete(deletable, true)

        if (deleted.size < deletable) {
          await interaction.followUp({
            embeds: [Embed.error(`Could not delete ${n} messages older than 14 days`)],
            ephemeral: true,
          })
          break
        }

        n -= deleted.size
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      if (n === 0) {
        await interaction.editReply({
          embeds: [Embed.success(`Purged **${options.getInteger('n') ?? '<unknown>'}** messages.`)],
        })
      }
      return CommandResult.Success
    }

    assert(to)

    return await purgeTo(interaction, to)
  },
})

export default COMMAND_PURGE

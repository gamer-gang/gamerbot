import assert from 'node:assert'
import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'
import { purgeTo } from './purgetohere.js'

const COMMAND_PURGE = command('CHAT_INPUT', {
  name: 'purge',
  description: 'Delete the last <n> messages, or delete all messages up to a message.',
  guildOnly: true,
  options: [
    {
      name: 'n',
      description: 'Number of messages to delete.',
      type: 'NUMBER',
    },
    {
      name: 'to',
      description: 'Delete messages up to this message.',
      type: 'STRING',
    },
  ],

  async run(context) {
    const { interaction, options } = context

    let n = options.getNumber('n')
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
          embeds: [Embed.info(`Purged ${options.getNumber('n') ?? '<unknown>'} messages`)],
        })
      }
      return CommandResult.Success
    }

    assert(to)

    return await purgeTo(interaction, to)
  },
})

export default COMMAND_PURGE

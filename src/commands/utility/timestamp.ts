import { Formatters } from 'discord.js'
import { getDateFromSnowflake, getDateStringFromSnowflake } from '../../util/discord.js'
import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'

const COMMAND_TIMESTAMP = command('CHAT_INPUT', {
  name: 'timestamp',
  description: 'Show timestamp of any Discord ID.',
  options: [
    {
      type: 'STRING',
      name: 'id',
      description: 'The ID to get the timestamp of.',
      autocomplete: true,
      required: true,
    },
  ],

  async autocomplete(interaaction) {
    const option = interaaction.options.getFocused(true)

    if (option.name !== 'id') return []

    const id = option.value.toString()

    if (!id) {
      return [{ name: 'Enter an ID...', value: '' }]
    }

    if (!/^\d{18}$/.test(id)) {
      return [{ name: 'Enter a valid ID.', value: '' }]
    }

    return [{ name: `${id}: ${getDateStringFromSnowflake(id).join(', ')}`, value: id }]
  },

  async run(context) {
    const { interaction } = context

    const id = interaction.options.getString('id', true)

    if (!id || !/^\d{18}$/.test(id)) {
      await interaction.reply({
        embeds: [Embed.error('Invalid ID.')],
        ephemeral: true,
      })
      return CommandResult.Success
    }

    const date = getDateFromSnowflake(id)
    const seconds = Math.round(date.toSeconds())

    const embed = new Embed({
      title: `Timestamp of ${id}`,
      description: `${getDateStringFromSnowflake(id).join('; ')}\n${Formatters.time(seconds, 'F')}`,
    })

    embed.setFooter({ text: date.toISO() })

    await interaction.reply({ embeds: [embed] })

    return CommandResult.Success
  },
})

export default COMMAND_TIMESTAMP

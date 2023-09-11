import { ApplicationCommandOptionType, ApplicationCommandType, time } from 'discord.js'
import { getDateFromSnowflake, getDateStringFromSnowflake } from '../../util/discord.js'
import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'

const COMMAND_TIMESTAMP = command(ApplicationCommandType.ChatInput, {
  name: 'timestamp',
  description: 'Show timestamp of any Discord ID.',
  examples: [
    {
      options: { id: '939924992345374730' },
      description:
        'Show the timestamp of the Discord ID 939924992345374730, which is 2022-02-06T11:46:21.137-05:00.',
    },
  ],
  options: [
    {
      type: ApplicationCommandOptionType.String,
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
    const { interaction, options } = context

    const id = options.getString('id', true)

    if (!id || !/^\d{18,}$/.test(id)) {
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
      description: `${getDateStringFromSnowflake(id).join('; ')}\n${time(seconds, 'F')}`,
    })

    embed.setFooter({ text: date.toISO({ includeOffset: true }) ?? '' })

    await interaction.reply({ embeds: [embed] })

    return CommandResult.Success
  },
})

export default COMMAND_TIMESTAMP

import { Embed } from '../../util/embed.js'
import { findErrorMessage, parseDiscohookJSON } from '../../util/message.js'
import command from '../command.js'

const COMMAND_APIMESSAGE = command('CHAT_INPUT', {
  name: 'apimessage',
  description: 'API Message',

  async run(context) {
    const { interaction, options, client } = context
    const json = options.getString('json', true)

    try {
      await interaction.reply(parseDiscohookJSON(json))
    } catch (err) {
      client.logger.error(err)
      await interaction.reply({ embeds: [Embed.error(findErrorMessage(err))], ephemeral: true })
    }
  },
})

export default COMMAND_APIMESSAGE

import { Embed } from '../../util/embed.js'
import { parseDiscohookJSON } from '../../util/message.js'
import command from '../command.js'

const COMMAND_APIMESSAGE = command('CHAT_INPUT', {
  name: 'apimessage',
  description: 'API Message',

  async run(context) {
    const { interaction } = context
    const json = interaction.options.getString('json', true)

    try {
      await interaction.reply(parseDiscohookJSON(json))
    } catch (err) {
      await interaction.reply({ embeds: [Embed.error(err.message)], ephemeral: true })
    }
  },
})

export default COMMAND_APIMESSAGE

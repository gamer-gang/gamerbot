import { Embed } from '../../util/embed.js'
import { parseDiscohookJSON } from '../../util/message.js'
import command, { CommandResult } from '../command.js'

const COMMAND_APIMESSAGE = command('CHAT_INPUT', {
  name: 'apimessage',
  description: 'API Message',

  async run(context) {
    const { interaction, options, client } = context
    const json = options.getString('json', true)

    try {
      await interaction.reply(parseDiscohookJSON(json))
      return CommandResult.Success
    } catch (err) {
      client.getLogger('/apimessage').error(err)
      await interaction.reply({ embeds: [Embed.error(err)], ephemeral: true })
      return CommandResult.Failure
    }
  },
})

export default COMMAND_APIMESSAGE

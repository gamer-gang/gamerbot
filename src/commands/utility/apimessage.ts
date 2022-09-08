import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  InteractionReplyOptions,
} from 'discord.js'
import { Embed } from '../../util/embed.js'
import { parseDiscordJson } from '../../util/message.js'
import command, { CommandResult } from '../command.js'

const COMMAND_APIMESSAGE = command(ApplicationCommandType.ChatInput, {
  name: 'apimessage',
  description: 'Create a message from a JSON message payload.',
  examples: [
    {
      options: { json: '`{ "content": "Hello World!" }`' },
      description: 'Create a message with the content "Hello World!".',
    },
    {
      options: {
        json: '`{ "embeds": [{ "title": "Hello World!", "description": "foo bar baz" }] }`',
      },
      description:
        'Create a message with an embed titled "Hello World!" with a description of "foo bar baz".',
    },
  ],
  options: [
    {
      name: 'json',
      description: 'JSON message data to create.',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  async run(context) {
    const { interaction, options, client } = context
    const json = options.getString('json', true)

    try {
      await interaction.reply(parseDiscordJson(json) as InteractionReplyOptions)
      return CommandResult.Success
    } catch (err) {
      client.getLogger('/apimessage').error(err)
      await interaction.reply({ embeds: [Embed.error(err)], ephemeral: true })
      return CommandResult.Failure
    }
  },
})

export default COMMAND_APIMESSAGE

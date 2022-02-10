import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'

const COMMAND_LMGTFY = command('CHAT_INPUT', {
  name: 'lmgtfy',
  description: 'Let me get that for you.',
  options: [
    {
      name: 'query',
      description: 'The query to search for.',
      type: 'STRING',
      required: true,
    },
    {
      name: 'engine',
      description: 'The search engine to use.',
      type: 'STRING',
      choices: [
        { name: 'Google (LMGTFY)', value: 'lmgtfy' },
        { name: 'DuckDuckGo', value: 'duckduckgo' },
      ],
    },
  ],

  async run(context) {
    const { interaction, options } = context

    const query = options.getString('query')
    const engine = options.getString('engine') ?? 'google'

    if (query == null) {
      await interaction.reply({
        embeds: [Embed.error('No search query provided')],
        ephemeral: true,
      })
      return CommandResult.Success
    }

    const encoded = query
      .split(' ')
      .map((word) => encodeURIComponent(word))
      .join('+')

    if (engine === 'lmgtfy') {
      await interaction.reply(`https://lmgtfy.app/?q=${encoded}`)
    } else {
      await interaction.reply(`https://duckduckgo.com/?q=${encoded}`)
    }
    return CommandResult.Success
  },
})

export default COMMAND_LMGTFY

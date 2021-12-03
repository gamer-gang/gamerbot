import { Embed } from '../../util/embed.js'
import command from '../command.js'

const COMMAND_LMGTFY = command('CHAT_INPUT', {
  name: 'lmgtfy',
  description:
    "Let me google that for you. (note: you need to disable adblockers on this site if it doesn't work)",
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
      return await interaction.reply({
        embeds: [Embed.error('No search query provided')],
        ephemeral: true,
      })
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
  },
})

export default COMMAND_LMGTFY

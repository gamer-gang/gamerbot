import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js'
import _ from 'lodash'
import { getSummary, search } from '../../types/wikipedia.js'
import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'

const COMMAND_WIKI = command(ApplicationCommandType.ChatInput, {
  name: 'wiki',
  description: 'Search for and display a Wikipedia article.',
  options: [
    {
      name: 'query',
      description: 'The search query.',
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    },
  ],
  async autocomplete(context) {
    const { options } = context
    const { name, value } = options.getFocused(true)
    if (name !== 'query') return []

    if (!value) return []

    const results = await search('title', value, 5)

    return results.pages.map((page) => ({
      name: page.title,
      value: page.key,
    }))
  },

  async run(context) {
    const { interaction } = context

    const query = interaction.options.getString('query', true)
    const results = await search('page', query, 1)

    await interaction.deferReply()

    if (results.pages.length === 0) {
      await interaction.editReply('No results found.')
      return CommandResult.Success
    }

    const page = results.pages[0]
    const summary = await getSummary(page.key)

    const embed = new Embed({
      author: {
        name: 'Wikipedia, the free encyclopedia',
        url: 'https://wikipedia.org',
        iconURL: 'https://upload.wikimedia.org/wikipedia/commons/6/63/Wikipedia-logo.png',
      },
      title: `${page.title} https://wikipedia.org/wiki/${page.key}`,
      description: `${page.description}\n\n${_.truncate(summary, { length: 500 })}`,
    })

    if (page.thumbnail) {
      embed.setThumbnail(`https:${page.thumbnail.url}`)
    }

    await interaction.editReply({ embeds: [embed] })

    return CommandResult.Success
  },
})

export default COMMAND_WIKI

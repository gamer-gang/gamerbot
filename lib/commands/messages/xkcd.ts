import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js'
import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'

const BASE_URL = 'https://xkcd.com'

const COMMAND_XKCD = command(ApplicationCommandType.ChatInput, {
  name: 'xkcd',
  description: 'Display a link to a random xkcd comic, or a specific comic if specified.',
  examples: [
    {
      options: {},
      description: 'Display a link to a random xkcd comic.',
    },
    {
      options: { num: '123' },
      description: 'Display https://xkcd.com/123.',
    },
  ],
  options: [
    {
      name: 'comic',
      description: 'The comic to get. If omitted, a random comic will be chosen.',
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
    },
  ],

  async autocomplete(interaction) {
    const value = interaction.options.getString('comic')
    if (value == null || isNaN(+value) || value === '') {
      return []
    }

    const response = await fetch(`${BASE_URL}/${+value}/info.0.json`)
    const data: XKCDResponse = await response.json()

    if (response.status > 500) {
      return [{ name: `Server error: ${response.statusText}`, value: 'error' }]
    }

    if (response.status === 404) {
      return [{ name: 'Comic not found.', value: 'not-found' }]
    }

    if (response.status > 400) {
      return [{ name: `Client error: ${response.statusText}`, value: 'error' }]
    }

    if (response.status !== 200) {
      return [{ name: 'Invalid number', value: -1 }]
    }

    return [{ name: `${data.num}: ${data.title}`, value: data.num.toString() }]
  },

  async run(context) {
    const { interaction, options } = context

    const value = options.getString('comic')
    if (value != null) {
      const number = value.split(':')[0]
      if (isNaN(+number)) {
        await interaction.reply({ embeds: [Embed.error('Invalid comic.')], ephemeral: true })
        return CommandResult.Success
      }
      await interaction.reply(`${BASE_URL}/${number}`)
      return CommandResult.Success
    }

    const res = await fetch(`${BASE_URL}/info.0.json`)
    const data: XKCDResponse = await res.json()

    await interaction.reply(`${BASE_URL}/${Math.ceil(Math.random() * data.num)}`)
    return CommandResult.Success
  },
})

export default COMMAND_XKCD

interface XKCDResponse {
  month: string
  num: number
  link: string
  year: string
  news: string
  safe_title: string
  transcript: string
  alt: string
  img: string
  title: string
  day: string
}

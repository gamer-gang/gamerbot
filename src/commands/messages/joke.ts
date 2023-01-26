import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js'
import command, { CommandResult } from '../command.js'

const COMMAND_JOKE = command(ApplicationCommandType.ChatInput, {
  name: 'joke',
  description: 'Get a random joke from the internet.',
  options: [
    {
      name: 'offensive',
      description: 'Allow offensive jokes',
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
    {
      name: 'category',
      description: 'The category of joke to get',
      type: ApplicationCommandOptionType.String,
      required: false,
      choices: [
        { name: 'any', value: 'any' },
        { name: 'normal', value: 'normal' },
        { name: 'programming', value: 'programming' },
        { name: 'funny', value: 'funny' },
      ],
    },
  ],

  async run(context) {
    const { interaction, options } = context
    const category = (options.getString('category') ?? 'any') as
      | 'normal'
      | 'programming'
      | 'funny'
      | 'any'

    const makeUrl = (type: string) => {
      const params = new URLSearchParams()

      params.set('format', 'txt')

      const offensive = options.getBoolean('offensive') ?? false

      return `https://v2.jokeapi.dev/joke/${type}?${params.toString()}${
        offensive ? '' : '&safe-mode&blacklistFlags=nsfw,religious,political,racist,sexist,explicit'
      }`
    }

    if (category === 'funny') {
      interaction.reply("Man turns himself into a pickle, funniest thing I've ever seen")
      return CommandResult.Success
    }

    await interaction.deferReply()

    const categories: Record<typeof category, string> = {
      normal: 'Miscellaneous,Pun,Spooky,Christmas',
      programming: 'Programming',
      any: 'Miscellaneous,Pun,Spooky,Christmas,Programming',
    }

    const response = await fetch(makeUrl(categories[category]))
    const data = await response.text()

    interaction.editReply(data)

    return CommandResult.Success
  },
})

export default COMMAND_JOKE

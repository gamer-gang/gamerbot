import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ButtonBuilder,
  ButtonStyle,
  InteractionEditReplyOptions,
  RepliableInteraction,
  StringSelectMenuBuilder,
  cleanContent,
} from 'discord.js'
import { KnownInteractions } from '../../types.js'
import { UrbanDictionaryResponse, UrbanDictionaryTerm } from '../../types/urbandictionary.js'
import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'

const COMMAND_URBAN = command(ApplicationCommandType.ChatInput, {
  name: 'urban',
  description: 'Define a term using Urban Dictionary.',
  options: [
    {
      name: 'term',
      description: 'The term to define.',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  async run(context) {
    const { interaction } = context
    const term = interaction.options.getString('term', true)
    return sendUrban(interaction, term)
  },
})

export const sendUrban = async (
  interaction: RepliableInteraction,
  term: string
): Promise<CommandResult> => {
  await interaction.deferReply()

  const url = new URL('https://api.urbandictionary.com/v0/define')
  url.searchParams.set('term', term)

  const response = await fetch(url)
  const { list: definitions } = (await response.json()) as UrbanDictionaryResponse

  if (!definitions.length) {
    await interaction.editReply({
      embeds: [
        Embed.error(`No definitions found for ${cleanContent(term, interaction.channel!)}.`),
      ],
    })
    return CommandResult.Success
  }

  let index = 0
  const message = await interaction.editReply(makeMessage(index, definitions))

  if (definitions.length === 1) {
    // no need to collect if there's only one definition
    return CommandResult.Success
  }

  const collector = message.createMessageComponentCollector({
    idle: 1000 * 60 * 5,
    dispose: true,
    filter: (interaction) => interaction.customId === 'prev' || interaction.customId === 'next',
  })

  collector.on('collect', (interaction) => {
    if (interaction.customId === 'prev') {
      if (index === 0) return
      index--
    } else {
      if (index === definitions.length - 1) return
      index++
    }

    interaction.update(makeMessage(index, definitions))
  })

  return CommandResult.Success
}

const makeMessage = (
  index: number,
  definitions: UrbanDictionaryTerm[]
): InteractionEditReplyOptions => {
  const { word, permalink, definition, thumbs_down, thumbs_up, example } = definitions[index]

  const [linkedDefinition, definitionTerms] = linkDefinitions(definition)
  const [linkedExample, exampleTerms] = linkDefinitions(example)

  const newTerms = [...new Set([
    ...definitionTerms.map((term) => term.toLowerCase()),
    ...exampleTerms.map((term) => term.toLowerCase()),
  ])]

  const embed = new Embed({
    author: {
      name: 'Urban Dictionary',
      url: 'https://www.urbandictionary.com/',
      icon_url: 'https://www.urbandictionary.com/favicon-32x32.png',
    },
    title: word,
    url: permalink,
    description: `${linkedDefinition}\n\n${linkedExample}\n\n👍 ${thumbs_up} 👎 ${thumbs_down}`,
    footer: {
      text: `Definition ${index + 1} of ${definitions.length}`,
    },
  })

  const components: (
    | ActionRowBuilder<ButtonBuilder>
    | ActionRowBuilder<StringSelectMenuBuilder>
  )[] = []

  if (newTerms.length) {
    components.push(
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(KnownInteractions.UrbanDefine)
          .setMinValues(1)
          .setMaxValues(1)
          .setPlaceholder('Define a term...')
          .addOptions(newTerms.map((term) => ({ label: term, value: term })))
      )
    )
  }

  if (definitions.length > 1) {
    components.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Primary)
          .setCustomId('prev')
          .setLabel('◀️')
          .setDisabled(index === 0),
        new ButtonBuilder()
          .setStyle(ButtonStyle.Primary)
          .setCustomId('next')
          .setLabel('▶️')
          .setDisabled(index === definitions.length - 1)
      )
    )
  }

  return {
    embeds: [embed],
    components,
  }
}

const linkDefinitions = (content: string): [linked: string, terms: string[]] => {
  const terms: string[] = []
  const linked = content.replaceAll(/\[(.+?)\]/g, (s) => {
    const term = s.slice(1, -1)
    terms.push(term)
    return `[${term}](https://www.urbandictionary.com/define.php?term=${encodeURIComponent(term)})`
  })

  return [linked, terms]
}

export default COMMAND_URBAN

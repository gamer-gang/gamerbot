import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  escapeItalic,
} from 'discord.js'
import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'

const COMMAND_MARKOV = command(ApplicationCommandType.ChatInput, {
  name: 'markov',
  description: 'Generate a markov chain from all messages gamerbot has seen.',
  options: [
    {
      name: 'connections',
      description: 'Get the top completions for a specific word.',
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
    },
    {
      name: 'length',
      description: 'Number of words to generate (2-200, default: 20).',
      type: ApplicationCommandOptionType.Integer,
    },
    {
      name: 'seed',
      description: 'A word to start the chain with (default: random).',
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
    },
    {
      name: 'guaranteed',
      description:
        'Only chooses words that have connections to other words (chain will not end before given length).',
      type: ApplicationCommandOptionType.Boolean,
    },
  ],

  async autocomplete(interaction, client) {
    const input = interaction.options.getFocused(true)
    if (
      input == null ||
      (input.name !== 'seed' && input.name !== 'connections')
    ) {
      return []
    }

    const guildId = interaction.guildId ?? ''
    const seed = input.value
    if (typeof seed !== 'string') return []

    const words = Object.keys(client.ext.markov.graph.guilds[guildId])

    const results = words
      .filter((word) => word.startsWith(seed))
      .map((word) => ({
        name: `${word} (${Object.values(client.ext.markov.graph.guilds[guildId][word]).length} connections)`,
        value: word,
      }))

    if (results.length === 0) {
      return [{ name: 'No results found.', value: '<no-results-found>' }]
    }

    return results.slice(0, 25)
  },

  async run(context) {
    const { interaction, client } = context

    const guildId = interaction.guildId ?? ''
    const connectionsSeed = interaction.options.getString('connections')
    if (connectionsSeed) {
      if (!client.ext.markov.graph.guilds[guildId][connectionsSeed]) {
        await interaction.reply({
          embeds: [Embed.error('Seed not found.')],
          ephemeral: true,
        })
        return CommandResult.Success
      }

      const connections = client.ext.markov.connections(
        connectionsSeed,
        guildId
      )
      const list = Object.entries(connections)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 25)
      const total = Object.values(connections).reduce((a, b) => a + b, 0)

      const embed = new Embed({
        title: `Connections for ${connectionsSeed}`,
        description: list
          .map(
            ([word, count], i) =>
              `**${i + 1}.** ${
                /^\*+$/.test(word) ? `\`${word}\`` : escapeItalic(word)
              } (${count.toLocaleString()}, \`${Math.round((count / total) * 100_00) / 100}%\`)`
          )
          .join('\n'),
      })

      await interaction.reply({ embeds: [embed] })

      return CommandResult.Success
    }

    const length = interaction.options.getInteger('length') ?? 20

    if (length < 2 || length > 200) {
      await interaction.reply({
        embeds: [Embed.error('Length must be between 2 and 200.')],
      })
      return CommandResult.Success
    }

    const seed = interaction.options.getString('seed')

    if (seed && !client.ext.markov.graph.guilds[guildId][seed]) {
      await interaction.reply({
        embeds: [Embed.error('Seed not found.')],
        ephemeral: true,
      })
      return CommandResult.Success
    }

    const chain = client.ext.markov.generateMessage(
      length,
      guildId,
      seed ?? undefined,
      interaction.options.getBoolean('guaranteed') ?? false
    )

    await interaction.reply(chain)

    return CommandResult.Success
  },
})

export default COMMAND_MARKOV

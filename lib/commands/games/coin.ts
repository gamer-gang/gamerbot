import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
} from 'discord.js'
import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'
import { canAfford, transferEggs } from './_wager.js'
import { challengePlayer } from '../../util/games.js'
import { sleep } from 'bun'

const COMMAND_COIN = command(ApplicationCommandType.ChatInput, {
  name: 'coin',
  description: 'Flip a coin, optionally bet against someone.',
  examples: [
    {
      options: { user: { mention: 'Frog' } },
      description: 'Challenge @Frog to a coin flip.',
    },
  ],
  options: [
    {
      name: 'type',
      description: 'What type of coin to use.',
      type: ApplicationCommandOptionType.String,
      required: false,
      autocomplete: true,
    },
    {
      name: 'odds',
      description: 'Change the odds of getting heads to this.',
      type: ApplicationCommandOptionType.Number,
      required: false,
    },
    {
      name: 'user',
      description: 'The user to duel.',
      type: ApplicationCommandOptionType.User,
      required: false,
    },
    {
      name: 'wager',
      description: 'How many eggs to bet. This is how much you will lose/win.',
      type: ApplicationCommandOptionType.Integer,
      required: false,
    },
  ],

  async autocomplete(interaction) {
    const input = interaction.options.getFocused(true)
    if (input.name === 'type') {
      const matches = Object.keys(coins).filter((coin) =>
        coin.includes(input.value.toString().trim())
      )

      if (matches.length === 0) {
        return [{ name: 'No results found.', value: '-' }]
      }

      return matches.slice(0, 25).map((coin) => ({ name: coin, value: coin }))
    }

    return []
  },

  async run(context) {
    const { interaction, options } = context

    const coinType = (options.getString('type') ??
      'standard') as keyof typeof coins

    const odds = options.getInteger('odds') ?? 0.5

    const wager = options.getInteger('wager')
    const opponentId = options.getUser('user')?.id

    if (wager && !opponentId) {
      interaction.reply({
        embeds: [
          Embed.error("You can't bet with a wager if there is no opponent."),
        ],
      })
      return CommandResult.Success
    }

    if (!opponentId) {
      interaction.reply({
        embeds: [
          new Embed({
            title: `${interaction.user.displayName}'s Coin Flip`,
            description: `${Math.random() < odds ? coins[coinType][0] : coins[coinType][1]}!`,
          }),
        ],
      })
      return CommandResult.Success
    }

    if (wager && opponentId) {
      if (
        !(await canAfford(interaction, interaction.user.id, opponentId, wager))
      ) {
        return CommandResult.Success
      }
    }

    const response = await challengePlayer(
      interaction,
      options,
      `coin flip${odds != 0.5 ? ` (odds: ${odds}-${odds})` : ''}`,
      '🪙',
      wager
    )

    if (!response) {
      return CommandResult.Success
    }
    const opponent = response.button.user
    const winner = Math.random() < odds ? 0 : 1

    for (const char of loading) {
      await Promise.all([
        response.message.edit({
          embeds: [
            new Embed({
              title: `Coin Flip: ${interaction.user.displayName} vs ${opponent.displayName}`,
              description: `Flipping... ${char}`,
            }),
          ],
          components: [],
        }),
        sleep(1000),
      ])
    }

    await response.message.edit({
      embeds: [
        new Embed({
          title: `Coin Flip: ${interaction.user.displayName} vs ${opponent.displayName}`,
          description: `${coins[coinType][winner]}! ${winner === 0 ? interaction.user.displayName : opponent.displayName} wins${wager ? ` ${wager} eggs` : ''}!`,
        }),
      ],
    })

    if (wager) {
      if (winner === 0) {
        await transferEggs(opponent.id, interaction.user.id, wager)
      } else {
        await transferEggs(interaction.user.id, opponent.id, wager)
      }
    }

    return CommandResult.Success
  },
})

const coins = {
  standard: ['Heads', 'Tails'],
  yesno: ['Yes', 'No'],
  binary: ['0', '1'],
  boolean: ['True', 'False'],
  wheeloffortune: ['!!!', 'Nope'],
}

const loading = ['-', '\\', '|', '/', '-']

export default COMMAND_COIN

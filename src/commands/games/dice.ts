import {
  ActionRowBuilder,
  APIMessageComponentEmoji,
  APISelectMenuOption,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ComponentType,
  formatEmoji,
  Message,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  User,
} from 'discord.js'
import { GamerbotClient } from '../../client/GamerbotClient.js'
import { Embed } from '../../util/embed.js'
import { challengePlayer } from '../../util/games.js'
import command, { CommandResult } from '../command.js'
import { isTooBroke, updateBalances } from './wager.js'

const COMMAND_DICE = command(ApplicationCommandType.ChatInput, {
  name: 'dice',
  description: "Duel someone else in a game of liar's dice/swindlestones",
  examples: [
    {
      options: { user: { mention: 'Frog' } },
      description: "Challenge @Frog to a game of liar's dice.",
    },
  ],
  options: [
    {
      name: 'user',
      description: 'The user to duel.',
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: 'wager',
      description: 'How many eggs to bet. This is how much you will lose/win.',
      type: ApplicationCommandOptionType.Integer,
      required: false,
    },
  ],

  async run(context) {
    const { interaction, options, client } = context

    const wager = options.getInteger('wager')
    const opponentId = options.getUser('user')?.id

    if (wager && opponentId) {
      if (await isTooBroke(interaction, interaction.user.id, opponentId, wager)) {
        return CommandResult.Success
      }
    }

    const challengeResponse = await challengePlayer(interaction, options, 'dice', '🎲')

    if (!challengeResponse) {
      return CommandResult.Success
    }

    const { button: response } = challengeResponse
    const opponent = response.user

    const hands = [
      [roll(), roll(), roll(), roll()].sort((a, b) => a - b),
      [roll(), roll(), roll(), roll()].sort((a, b) => a - b),
    ]

    const bidMessages: string[] = []
    let gameMessage: Message | undefined
    let lastInteraction: StringSelectMenuInteraction | undefined

    await interaction.followUp({
      embeds: [
        Embed.info(
          `This is your hand, ${interaction.user}! Keep it secret.`,
          handToString(client, hands[0])
        ),
      ],
      ephemeral: true,
    })

    await response.followUp({
      embeds: [
        Embed.info(
          `This is your hand, ${response.user}! Keep it secret.`,
          handToString(client, hands[1])
        ),
      ],
      ephemeral: true,
    })

    let firstPlayerTurn = true
    // the index of the last bid in possibleBids
    let lastBid = -1
    while (true) {
      const currentTurn = firstPlayerTurn ? interaction.user : opponent
      const options = {
        ...makeGameMessage(currentTurn, bidMessages),
        components: [makeBidSelector(client, lastBid)],
      }
      if (!gameMessage) {
        gameMessage = (await interaction.channel?.send(options)) as Message
      } else if (lastInteraction) {
        await lastInteraction.update(options)
      } else {
        throw new Error('Invalid state: no bid interaction message and no last interaction')
      }

      const losingWagerString = wager ? ` and lost ${wager} eggs` : ''

      try {
        lastInteraction = await gameMessage.awaitMessageComponent({
          componentType: ComponentType.StringSelect,
          filter: (i) => i.user.id === currentTurn.id,
          time: 60000,
        })
      } catch (error) {
        if (wager) await updateBalances(interaction.user.id, opponent.id, wager)

        void interaction.followUp({
          embeds: [Embed.error(`${currentTurn} failed to bid${losingWagerString}.`)],
        })
        break
      }

      if (lastInteraction == null) {
        if (wager) await updateBalances(opponent.id, interaction.user.id, wager)

        void interaction.followUp({
          embeds: [Embed.error(`${currentTurn} failed to bid${losingWagerString}.`)],
        })
        break
      }

      if (lastInteraction.values[0] === 'call') {
        bidMessages.push(`${currentTurn} calls!`)
        lastInteraction.update({
          ...makeGameMessage(currentTurn, bidMessages),
          content: 'Game over!',
          components: [],
        })

        const [quantity, face] = possibleBids[lastBid]

        // Call succeeded case, the caller wins
        let winner = currentTurn
        // If the call fails, the opponent wins
        if (sumHand(face, hands[0]) + sumHand(face, hands[1]) >= quantity) {
          winner = firstPlayerTurn ? opponent : interaction.user
        }
        const callSuccess = winner === currentTurn

        const winningWagerString = wager ? ` ${wager} eggs` : ''

        if (wager) {
          if (winner.id == interaction.user.id) await updateBalances(winner.id, opponent.id, wager)
          else await updateBalances(winner.id, interaction.user.id, wager)
        }

        await interaction.followUp({
          embeds: [
            Embed.success(
              `The call ${
                callSuccess ? 'succeded' : 'failed'
              }; **${winner} wins${winningWagerString}!**`
            ).addFields(
              {
                name: interaction.user.tag,
                value: handToString(client, hands[0]),
              },
              {
                name: opponent.tag,
                value: handToString(client, hands[1]),
              }
            ),
          ],
        })
        break
      }

      const bidIndex = parseInt(lastInteraction.values[0])
      const [quantity, face] = possibleBids[bidIndex]
      const emoji = emojis[face - 1]
      bidMessages.push(
        `${currentTurn} bids **${emoji ? formatEmoji(emoji.id!) : face} ×${quantity}**`
      )

      lastBid = parseInt(lastInteraction.values[0])
      firstPlayerTurn = !firstPlayerTurn
    }

    return CommandResult.Success
  },
})

// represents every possible bid
const possibleBids = [1, 2, 3, 4, 5, 6].map((i) => [1, 2, 3, 4].map((j) => [i, j])).flat()

const emojis: (APIMessageComponentEmoji | null)[] = []

function makeGameMessage(currentTurn: User, bidMessages: string[]) {
  const options = {
    content: currentTurn.toString(),
    embeds: [
      new Embed({
        title: `Place your bid, ${currentTurn.tag}!`,
        description: `**Bid History**\n${bidMessages.join('\n') ?? 'None'}`,
      }),
    ],
  }
  return options
}

function makeBidSelector(client: GamerbotClient, lastBid: number) {
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder({
      customId: 'bidSelection',
      placeholder: 'Select bid...',
      options:
        lastBid === -1
          ? [...generateBids(client, lastBid)]
          : [
              {
                label: 'Call',
                value: 'call',
              },
              ...generateBids(client, lastBid),
            ],
    })
  )
}

function handToString(client: GamerbotClient, hand: number[]): string {
  populateEmojis(client)
  return hand
    .map((die) => {
      const emoji = emojis[die - 1]
      return emoji ? formatEmoji(emoji.id!) : die.toString()
    })
    .join('  ')
}

function roll(): number {
  return Math.floor(Math.random() * 4) + 1
}

function generateBids(client: GamerbotClient, last: number): APISelectMenuOption[] {
  populateEmojis(client)

  return possibleBids.slice(last + 1).map((e, i) => {
    const emoji = emojis[e[1] - 1]
    return {
      emoji: emoji ?? undefined,
      label: emoji ? `× ${e[0]}` : `${e[0]} ×${e[1]}`,
      value: (last + i + 1).toString(),
    }
  })
}

// find the total number of a specific face in a hand
function sumHand(face: number, hand: number[]): number {
  return hand.filter((die) => die === face).length
}

function populateEmojis(client: GamerbotClient) {
  if (emojis.length !== 0) return

  for (let i = 1; i <= 6; i++) {
    const emoji = client.ext.customEmoji.get(`dice_${i}`)
    emojis.push(emoji ? { id: emoji.id, name: emoji.name! } : null)
  }
}

export default COMMAND_DICE

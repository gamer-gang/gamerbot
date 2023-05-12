import {
  ActionRowBuilder,
  APIMessageComponentEmoji,
  APISelectMenuOption,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ComponentType,
  Message,
  StringSelectMenuBuilder,
} from 'discord.js'
import { Embed } from '../../util/embed.js'
import { challengePlayer } from '../../util/games.js'
import command, { CommandResult } from '../command.js'

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
  ],

  async run(context) {
    const { interaction, options } = context

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

    await interaction.followUp({
      embeds: [Embed.info('Here is your hand:', handToString(hands[0]))],
      ephemeral: true,
    })

    await response.followUp({
      embeds: [Embed.info('Here is your hand:', handToString(hands[1]))],
      ephemeral: true,
    })

    let firstPlayerTurn = true
    // the index of the last bid in possibleBids
    let lastBid = -1
    while (true) {
      const msg = (await interaction.channel?.send({
        content: `Place your bid, ${firstPlayerTurn ? interaction.user.tag : opponent.tag}!`,
        components: [
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            new StringSelectMenuBuilder({
              customId: 'bidSelection',
              placeholder: 'Select bid...',
              options:
                lastBid === -1
                  ? [...generateBids(lastBid)]
                  : [
                      {
                        label: 'Call',
                        value: 'call',
                      },
                      ...generateBids(lastBid),
                    ],
            })
          ),
        ],
      })) as Message

      let bid

      try {
        bid = await msg.awaitMessageComponent({
          componentType: ComponentType.StringSelect,
          filter: (i) => i.user.id === (firstPlayerTurn ? interaction.user.id : opponent.id),
          time: 60000,
        })
      } catch (error) {
        void interaction.followUp({
          embeds: [
            Embed.error(`${firstPlayerTurn ? interaction.user.tag : opponent.tag} failed to bid.`),
          ],
        })
        break
      }

      if (bid == null) {
        void interaction.followUp({
          embeds: [
            Embed.error(`${firstPlayerTurn ? interaction.user.tag : opponent.tag} failed to bid.`),
          ],
        })
        break
      }

      if (bid.values[0] === 'call') {
        await bid.update({
          content: `${firstPlayerTurn ? interaction.user.tag : opponent.tag} calls!`,
          components: [],
        })
        const [quantity, face] = possibleBids[lastBid]

        // if it is the first player's turn and the bid is right, then first player wins
        let firstPlayerWin = firstPlayerTurn
        // if the call fails on the first player's turn, the other guy wins
        if (sumHand(face, hands[0]) + sumHand(face, hands[1]) >= quantity) {
          firstPlayerWin = !firstPlayerTurn
        }
        await interaction.followUp({
          embeds: [
            Embed.success(
              `${firstPlayerWin ? interaction.user.tag : opponent.tag} winner wins!`
            ).addFields(
              {
                name: interaction.user.tag,
                value: handToString(hands[0]),
              },
              {
                name: opponent.tag,
                value: handToString(hands[1]),
              }
            ),
          ],
        })
        break
      }

      const bidIndex = parseInt(bid.values[0])

      await bid.update({
        content: `${firstPlayerTurn ? interaction.user.tag : opponent.tag} bids ${numberToEmoji(
          possibleBids[bidIndex][1]
        )} x${possibleBids[bidIndex][0]}`,
        components: [],
      })

      lastBid = parseInt(bid.values[0])
      firstPlayerTurn = !firstPlayerTurn
    }

    return CommandResult.Success
  },
})

// represents every possible bid
const possibleBids = [1, 2, 3, 4].map((i) => [1, 2, 3, 4].map((j) => [i, j])).flat()

const emojis: APIMessageComponentEmoji[] = [
  { name: 'dice_1', id: '810580628445069332' },
  { name: 'dice_2', id: '810580488548253717' },
  { name: 'dice_3', id: '810580516892966913' },
  { name: 'dice_4', id: '810580555212259350' },
  { name: 'dice_5', id: '810580587240620062' },
  { name: 'dice_6', id: '810581269561737277' },
]

function numberToEmoji(face: number): string {
  const emoji = emojis[face - 1]
  return `<:${emoji.name}:${emoji.id}>`
}

function handToString(hand: number[]): string {
  return hand.map((die) => numberToEmoji(die)).join(', ')
}

function roll(): number {
  return Math.floor(Math.random() * 4) + 1
}

function generateBids(last: number): APISelectMenuOption[] {
  return possibleBids.slice(last + 1).map((e, i) => {
    return {
      emoji: emojis[e[1] - 1],
      label: `x${e[0]}`,
      value: (last + i + 1).toString(),
    }
  })
}

// find the total number of a specific face in a hand
function sumHand(face: number, hand: number[]): number {
  return hand.filter((die) => die === face).length
}

export default COMMAND_DICE

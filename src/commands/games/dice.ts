import {
  Message,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
  MessageSelectOptionData,
} from 'discord.js'
import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'

// represents every possible bid
const possibleBids = [1, 2, 3, 4].map((i) => [1, 2, 3, 4].map((j) => [i, j])).flat()

const COMMAND_DICE = command('CHAT_INPUT', {
  name: 'dice',
  description: "Duel someone else in a game of liar's dice/swindlestones",
  options: [
    {
      name: 'user',
      description: 'The user to duel.',
      type: 'USER',
      required: true,
    },
  ],

  async run(context) {
    const { interaction, options } = context

    const opponent = options.getUser('user')

    if (opponent == null) {
      await interaction.reply('Unable to resolve user.')
      return CommandResult.Success
    }

    const embed = new Embed({
      title: `${interaction.user.tag} has dueled ${opponent.tag} to a game of dice!`,
      description: 'Click ⚔ to accept.',
    })

    await interaction.reply({
      content: opponent.toString(),
      embeds: [embed],
      components: [
        new MessageActionRow({
          components: [
            new MessageButton({
              customId: 'start',
              style: 'PRIMARY',
              emoji: '🎲',
            }),
          ],
        }),
      ],
    })

    const reply = (await interaction.fetchReply()) as Message

    const opponentResponse = await reply
      .awaitMessageComponent({
        componentType: 'BUTTON',
        filter: (i) => i.user.id === opponent.id,
        time: 120 * 1000,
      })
      .catch()

    if (opponentResponse == null) {
      await interaction.followUp({
        embeds: [Embed.error('The duel timed out.')],
      })
      return CommandResult.Success
    }

    await opponentResponse.update({
      embeds: [new Embed(embed).setDescription('Duel accepted!')],
    })

    const hands = [
      [roll(), roll(), roll(), roll()].sort((a, b) => a - b),
      [roll(), roll(), roll(), roll()].sort((a, b) => a - b),
    ]

    await interaction.followUp({
      embeds: [Embed.info('Here is your hand:', hands[0].join(', '))],
      ephemeral: true,
    })

    await opponentResponse.followUp({
      embeds: [Embed.info('Here is your hand:', hands[1].join(', '))],
      ephemeral: true,
    })

    // await interaction.user.send(hands[0].toString())
    // await opponent.send(hands[1].toString())

    let firstPlayerTurn = true
    // the index of the last bid in possibleBids
    let lastBid = -1
    while (true) {
      const msg = await interaction.channel?.send({
        content: `Place your bid, ${firstPlayerTurn ? interaction.user.tag : opponent.tag}!`,
        components: [
          new MessageActionRow({
            components: [
              new MessageSelectMenu({
                custom_id: 'bidSelection',
                placeholder: 'Select bid...',
                options: [
                  {
                    label: 'Call',
                    value: 'call',
                  },
                  ...generateBids(lastBid),
                ],
              }),
            ],
          }),
        ],
      })

      const bid = await msg?.awaitMessageComponent({
        componentType: 'SELECT_MENU',
        filter: (i) => i.user.id === (firstPlayerTurn ? interaction.user.id : opponent.id),
        time: 60000,
      })

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
                value: hands[0].join(', '),
              },
              {
                name: opponent.tag,
                value: hands[1].join(', '),
              }
            ),
          ],
        })
        break
      }

      const bidIndex = parseInt(bid.values[0])

      await bid.update({
        content: `${firstPlayerTurn ? interaction.user.tag : opponent.tag} bids ${
          possibleBids[bidIndex][0]
        } dice with value ${possibleBids[bidIndex][1]}`,
        components: [],
      })

      lastBid = parseInt(bid.values[0])
      firstPlayerTurn = !firstPlayerTurn
    }

    return CommandResult.Success
  },
})

function roll(): number {
  return Math.floor(Math.random() * 4) + 1
}

function generateBids(last: number): MessageSelectOptionData[] {
  return possibleBids.slice(last + 1).map((e, i) => {
    return { label: `${e[0]} dice of value ${e[1]}`, value: (last + i + 1).toString() }
  })
}

// find the total number of a specific face in a hand
function sumHand(face: number, hand: number[]): number {
  return hand.filter((die) => die === face).length
}

export default COMMAND_DICE

import { ApplicationCommandOptionType, ApplicationCommandType, Message } from 'discord.js'
import { Embed } from '../../util/embed.js'
import { challengePlayer } from '../../util/games.js'
import command, { CommandResult } from '../command.js'
import { canAfford, transferEggs } from './_wager.js'

const COMMAND_CONNECT4 = command(ApplicationCommandType.ChatInput, {
  name: 'connect4',
  description: 'Play a game of connect four with someone.',
  examples: [
    {
      options: { user: { mention: 'Frog' } },
      description: 'Challenge @Frog to a game of connect four.',
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
    const { interaction, options } = context

    const wager = options.getInteger('wager')
    const opponentId = options.getUser('user')?.id

    if (wager && opponentId) {
      if (!(await canAfford(interaction, interaction.user.id, opponentId, wager))) {
        return CommandResult.Success
      }
    }

    const response = await challengePlayer(interaction, options, 'connect four', '⚔️', wager)

    if (!response) {
      return CommandResult.Success
    }

    const opponent = response.button.user

    // indexes are [col][row], row 0 being the bottom
    const state: Cell[][] = Array(7)
      .fill(0)
      .map(() => Array(6))

    const msg = (await interaction.followUp({
      embeds: [
        new Embed({
          title: `Connect Four: ${interaction.user.tag} 🔴 vs ${opponent.tag} 🟡!`,
          description: 'Loading...',
        }),
      ],
    })) as Message

    for (const emoji of emojis) {
      await msg.react(emoji)
    }

    const collector = msg.createReactionCollector({
      idle: 60_000,
    })

    let firstPlayerTurn = true

    await msg.edit({
      embeds: [
        new Embed({
          title: `Connect Four: ${interaction.user.tag} 🔴 vs ${opponent.tag} 🟡! It is ${interaction.user.tag}'s turn.`,
          description: boardStateToString(state),
        }),
      ],
    })

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    collector.on('collect', async (reaction, user) => {
      if (!user.bot) {
        await reaction.users.remove(user.id)
      }

      if (
        !reaction.emoji.name ||
        !emojis.includes(reaction.emoji.name) ||
        !(user.id === (firstPlayerTurn ? interaction.user.id : opponent.id))
      ) {
        return
      }

      const move = emojiMap[reaction.emoji.name] - 1

      if (!dropToken(state, move, firstPlayerTurn ? 0 : 1)) {
        await msg.reply('invalid move')
        return
      }

      if (checkWin(state)) {
        return collector.stop('won')
      }

      if (checkTie(state)) {
        return collector.stop('tie')
      }

      firstPlayerTurn = !firstPlayerTurn
      await msg.edit({
        embeds: [
          new Embed({
            title: `Connect Four: ${interaction.user.tag} 🔴 vs ${opponent.tag} 🟡! It is ${
              firstPlayerTurn ? interaction.user.tag : opponent.tag
            }'s turn.`,
            description: boardStateToString(state, move),
          }),
        ],
      })
    })

    collector.on('end', async (collected, reason) => {
      void msg.edit({
        embeds: [
          new Embed({
            title: `Connect Four: ${interaction.user.tag} 🔴 vs ${opponent.tag} 🟡!`,
            description: boardStateToString(state),
          }),
        ],
      })
      void msg.reactions.removeAll()
      if (reason === 'won') {
        if (wager) {
          if (firstPlayerTurn) transferEggs(opponent.id, interaction.user.id, wager)
          else transferEggs(interaction.user.id, opponent.id, wager)
        }

        void msg.reply({
          embeds: [
            Embed.success(
              'Connect Four',
              `${firstPlayerTurn ? interaction.user.tag : opponent.tag} won${
                wager ? ` ${wager} eggs` : ''
              }!`
            ),
          ],
        })
      } else if (reason === 'tie') {
        void msg.reply({
          embeds: [Embed.success('Connect Four', "It's a tie!")],
        })
      } else {
        if (wager) {
          if (firstPlayerTurn) transferEggs(interaction.user.id, opponent.id, wager)
          else transferEggs(opponent.id, interaction.user.id, wager)
        }

        void msg.reply({
          embeds: [
            new Embed({
              title: 'Connect Four',
              description: `${
                firstPlayerTurn ? interaction.user.tag : opponent.tag
              } failed to move${wager ? ` and lost ${wager} eggs` : ''}.`,
            }),
          ],
        })
      }
    })

    return CommandResult.Success
  },
})

// warning: the code below sucks.
function boardStateToString(state: Cell[][], lastMove?: number): string {
  const arr: string[][] = []
  const len = state[0].length - 1
  for (let row = 0; row < state[0].length; row++) {
    for (let col = 0; col < state.length; col++) {
      arr[row] ??= []
      if (state[col][len - row] === undefined) {
        arr[row][col] = '⚫'
      } else if (lastMove && state[col][len - row + 1] === undefined && col === lastMove) {
        arr[row][col] = state[col][len - row] === 0 ? '🟥' : '🟨'
      } else {
        arr[row][col] = state[col][len - row] === 0 ? '🔴' : '🟡'
      }
    }
  }
  arr.push(emojis)
  return arr.map((line) => line.join('')).join('\n')
}

function dropToken(state: Cell[][], col: number, player: 0 | 1): boolean {
  const i = state[col].findIndex((e) => e === undefined)
  if (i === -1) return false
  state[col][i] = player
  return true
}

function checkWin(state: Cell[][]): boolean {
  // horizontal check
  for (let i = 0; i < state.length - 3; i++) {
    for (let j = 0; j < state[i].length; j++) {
      if (allEqual(state[i][j], state[i + 1][j], state[i + 2][j], state[i + 3][j])) return true
    }
  }
  // vertical check
  for (let i = 0; i < state.length; i++) {
    for (let j = 0; j < state[i].length - 3; j++) {
      if (allEqual(state[i][j], state[i][j + 1], state[i][j + 2], state[i][j + 3])) return true
    }
  }
  // ascending diagonal check
  for (let i = 0; i < state.length - 3; i++) {
    for (let j = 0; j < state[i].length - 3; j++) {
      if (allEqual(state[i][j], state[i + 1][j + 1], state[i + 2][j + 2], state[i + 3][j + 3])) {
        return true
      }
    }
  }
  // descending diagonal check
  for (let i = 0; i < state.length - 3; i++) {
    for (let j = 2; j < state[i].length; j++) {
      if (allEqual(state[i][j], state[i + 1][j - 1], state[i + 2][j - 2], state[i + 3][j - 3])) {
        return true
      }
    }
  }
  return false
}

function checkTie(state: Cell[][]): boolean {
  return state.every((e) => e.at(-1) !== undefined)
}

function allEqual(...args: Cell[]): boolean {
  return args[0] !== undefined && args.every((e) => e === args[0])
}

const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣']

const emojiMap: { [key: string]: number } = {
  '1️⃣': 1,
  '2️⃣': 2,
  '3️⃣': 3,
  '4️⃣': 4,
  '5️⃣': 5,
  '6️⃣': 6,
  '7️⃣': 7,
}

type Cell = 0 | 1 | undefined

export default COMMAND_CONNECT4

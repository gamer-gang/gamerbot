import { Message } from 'discord.js'
import { Embed } from '../../util/embed.js'
import { duelPlayer } from '../../util/games.js'
import command, { CommandResult } from '../command.js'

const COMMAND_CONNECT4 = command('CHAT_INPUT', {
  name: 'connect4',
  description: 'Duel someone in connect 4.',
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

    const response = await duelPlayer(interaction, options, 'connect 4', '⚔️')

    if (!response) {
      return CommandResult.Success
    }

    const opponent = response.user

    // indexes are [col][row], row 0 being the bottom
    const state: cell[][] = Array(7)
      .fill(0)
      .map(() => Array(6))

    const msg = (await interaction.followUp({
      embeds: [
        new Embed({
          title: `Connect 4: ${interaction.user.tag} 🔴 vs ${opponent.tag} 🟡!`,
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
          title: `Connect 4: ${interaction.user.tag} 🔴 vs ${opponent.tag} 🟡! It is ${interaction.user.tag}'s turn.`,
          description: convertState(state),
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

      // eslint-disable-next-line no-console
      console.log(reaction, user, reaction.emoji.name, emojiMap[reaction.emoji.name])
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
            title: `Connect 4: ${interaction.user.tag} 🔴 vs ${opponent.tag} 🟡! It is ${
              firstPlayerTurn ? interaction.user.tag : opponent.tag
            }'s turn.`,
            description: convertState(state, move),
          }),
        ],
      })
    })

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    collector.on('end', (collected, reason) => {
      void msg.edit({
        embeds: [
          new Embed({
            title: `Connect 4: ${interaction.user.tag} 🔴 vs ${opponent.tag} 🟡!`,
            description: convertState(state),
          }),
        ],
      })
      void msg.reactions.removeAll()
      if (reason === 'won') {
        void msg.reply({
          embeds: [
            Embed.success(
              'Connect 4',
              `${firstPlayerTurn ? interaction.user.tag : opponent.tag} won!`
            ),
          ],
        })
      } else if (reason === 'tie') {
        void msg.reply({
          embeds: [Embed.success('Connect 4', "It's a tie!")],
        })
      } else {
        void msg.reply({
          embeds: [
            new Embed({
              title: 'Connect 4',
              description: `${
                firstPlayerTurn ? interaction.user.tag : opponent.tag
              } failed to move.`,
            }),
          ],
        })
      }
    })

    return CommandResult.Success
  },
})

// warning: the code below sucks.
function convertState(state: cell[][], lastMove?: number): string {
  const arr: string[][] = []
  const len = state[0].length - 1
  for (let row = 0; row < state[0].length; row++) {
    for (let col = 0; col < state.length; col++) {
      if (arr[row] === undefined) arr[row] = []
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
  return arr.map((e) => e.join('')).join('\n')
}

function dropToken(state: cell[][], col: number, player: 0 | 1): boolean {
  const i = state[col].findIndex((e) => e === undefined)
  if (i === -1) return false
  state[col][i] = player
  return true
}

function checkWin(state: cell[][]): boolean {
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

function checkTie(state: cell[][]): boolean {
  return state.every((e) => e.at(-1) !== undefined)
}

function allEqual(...args: cell[]): boolean {
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

type cell = 0 | 1 | undefined

export default COMMAND_CONNECT4

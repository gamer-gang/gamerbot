import { MessageActionRow, MessageButton } from 'discord.js'
import _ from 'lodash'
import assert from 'node:assert'
import { Embed } from '../../util/embed.js'
import { challengePlayer } from '../../util/games.js'
import command, { CommandResult } from '../command.js'

const RPS_CHOICES = {
  rock: '✊',
  paper: '✋',
  scissors: '✌',
}

const COMMAND_RPS = command('CHAT_INPUT', {
  name: 'rps',
  description: 'Duel a user in rock paper scissors.',
  examples: [
    {
      options: { user: { mention: 'Frog' } },
      description: 'Challenge @Frog to rock paper scissors.',
    },
  ],
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

    const response = await challengePlayer(interaction, options, 'Rock Paper Scissors', '🪨')

    if (!response) {
      return CommandResult.Success
    }

    const opponent = response.button.user

    const choices = Object.entries(RPS_CHOICES).map(
      ([name, emoji]) =>
        new MessageButton({ customId: name, emoji, label: _.capitalize(name), style: 'PRIMARY' })
    )
    const row = new MessageActionRow({ components: choices })

    const moveEmbed = new Embed({
      title: 'Rock Paper Scissors',
      description: 'Select your move!',
      footer: { text: 'Time limit: 30 seconds' },
    })

    assert(interaction.channel, 'Interaction channel is undefined')

    const moveMessage = await interaction.channel.send({
      embeds: [moveEmbed],
      components: [row],
    })

    return await new Promise<CommandResult>((resolve) => {
      let move1: keyof typeof RPS_CHOICES | undefined
      let move2: keyof typeof RPS_CHOICES | undefined

      const collector = moveMessage.createMessageComponentCollector({
        componentType: 'BUTTON',
        time: 30_000,
        dispose: true,
      })

      collector.on('collect', (component) => {
        let isPlayer1 = false
        if (component.user.id === interaction.user.id) {
          isPlayer1 = true
          move1 = component.customId as keyof typeof RPS_CHOICES
        } else if (component.user.id === opponent.id) {
          move2 = component.customId as keyof typeof RPS_CHOICES
        } else {
          void component.reply({
            embeds: [Embed.error("This isn't your game!")],
            ephemeral: true,
          })
          return
        }

        if (move1 && move2) {
          void component
            .update({
              embeds: [moveEmbed.setDescription('Select your move!\nThinking...')],
              components: [],
            })
            .then(() => {
              collector.stop('both')
            })
          return
        }

        void component.update({
          embeds: [
            moveEmbed.setDescription(
              `Select your move!\n${isPlayer1 ? 'Player 1' : 'Player 2'} has selected their move!`
            ),
          ],
          components: [row],
        })
      })

      collector.on('end', () => {
        if (!move1 && !move2) {
          void moveMessage.edit({
            embeds: [Embed.error('Neither player selected a move.')],
            components: [],
          })
          return
        }
        if (!move1) {
          void moveMessage.edit({
            embeds: [Embed.error(`${interaction.user} didn't select a move.`)],
            components: [],
          })
        } else if (!move2) {
          void moveMessage.edit({
            embeds: [Embed.error(`${opponent} didn't select a move.`)],
            components: [],
          })
          return
        }

        assert(move1, 'move1 undefined after check')
        assert(move2, 'move2 undefined after check')

        const moveString = `${RPS_CHOICES[move1]} vs ${RPS_CHOICES[move2]}`

        if (move1 === move2) {
          void moveMessage.edit({
            embeds: [
              new Embed({
                title: `**${interaction.user.tag}'s and ${opponent.tag}'s RPS game**`,
                description: `The duel was a draw (${moveString})!`,
              }),
            ],
            components: [],
          })
          resolve(CommandResult.Success)
          return
        }

        let p1Win = true

        switch (move1) {
          case 'rock':
            if (move2 === 'scissors') p1Win = true
            if (move2 === 'paper') p1Win = false
            break
          case 'paper':
            if (move2 === 'rock') p1Win = true
            if (move2 === 'scissors') p1Win = false
            break
          case 'scissors':
            if (move2 === 'paper') p1Win = true
            if (move2 === 'rock') p1Win = false
            break
        }

        if (p1Win) {
          void moveMessage.edit({
            embeds: [
              new Embed({
                title: `**${interaction.user.tag}'s and ${opponent.tag}'s RPS game**`,
                description: `${interaction.user.tag} has won (${moveString})!`,
              }),
            ],
            components: [],
          })
          resolve(CommandResult.Success)
          return
        }

        void moveMessage.edit({
          embeds: [
            new Embed({
              title: `**${interaction.user.tag}'s and ${opponent.tag}'s RPS game**`,
              description: `${opponent.tag} has won (${moveString})!`,
            }),
          ],
          components: [],
        })
        resolve(CommandResult.Success)
      })
    })
  },
})

export default COMMAND_RPS

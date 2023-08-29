import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js'
import _ from 'lodash'
import assert from 'node:assert'
import { Embed } from '../../util/embed.js'
import { challengePlayer } from '../../util/games.js'
import command, { CommandResult } from '../command.js'
import { canAfford, transferEggs } from './_wager.js'

const RPS_CHOICES = {
  rock: '✊',
  paper: '✋',
  scissors: '✌',
}

const RPSLS_CHOICES = {
  ...RPS_CHOICES,
  lizard: '🤌',
  spock: '🖖',
}

const RPSLS_MATRIX = [
  [0, 0, 'crushes', 'smushes', 0],
  ['covers', 0, 0, 0, 'disproves'],
  [0, 'cuts', 0, 'decapitates', 0],
  [0, 'eats', 0, 0, 'poisons'],
  ['vaporizes', 0, 'breaks', 0, 0],
]

const COMMAND_RPS = command(ApplicationCommandType.ChatInput, {
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
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: 'lizard-and-spock',
      description: 'Whether to include lizard and spock.',
      type: ApplicationCommandOptionType.Boolean,
      required: false,
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
    const lizardSpock = options.getBoolean('lizard-and-spock')

    const wager = options.getInteger('wager')
    const opponentId = options.getUser('user')?.id

    if (wager && opponentId) {
      if (!(await canAfford(interaction, interaction.user.id, opponentId, wager))) {
        return CommandResult.Success
      }
    }

    const response = await challengePlayer(
      interaction,
      options,
      lizardSpock ? 'Rock Paper Scissors Lizard Spock' : 'Rock Paper Scissors',
      '🪨'
    )

    if (!response) {
      return CommandResult.Success
    }

    const opponent = response.button.user

    const choices = Object.entries(lizardSpock ? RPSLS_CHOICES : RPS_CHOICES).map(
      ([name, emoji]) =>
        new ButtonBuilder({
          customId: name,
          emoji,
          label: _.capitalize(name),
          style: ButtonStyle.Primary,
        })
    )
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(choices)

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
      let move1: keyof typeof RPSLS_CHOICES | undefined
      let move2: keyof typeof RPSLS_CHOICES | undefined

      const collector = moveMessage.createMessageComponentCollector({
        componentType: ComponentType.Button,
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

      collector.on('end', async () => {
        if (!move1 && !move2) {
          void moveMessage.edit({
            embeds: [Embed.error('Neither player selected a move.')],
            components: [],
          })
          return
        }

        const losingWagerString = wager ? ` and lost ${wager} eggs` : ''

        if (!move1) {
          void moveMessage.edit({
            embeds: [Embed.error(`${interaction.user} didn't select a move${losingWagerString}.`)],
            components: [],
          })
          if (wager) await transferEggs(interaction.user.id, opponent.id, wager)
          return
        } else if (!move2) {
          void moveMessage.edit({
            embeds: [Embed.error(`${opponent} didn't select a move${losingWagerString}.`)],
            components: [],
          })
          if (wager) await transferEggs(opponent.id, interaction.user.id, wager)
          return
        }

        assert(move1, 'move1 undefined after check')
        assert(move2, 'move2 undefined after check')

        const moveString = `${RPSLS_CHOICES[move1]} vs ${RPSLS_CHOICES[move2]}`

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

        const keys = Object.keys(RPSLS_CHOICES)
        const key1 = keys.indexOf(move1)
        const key2 = keys.indexOf(move2)

        const matchup1 = RPSLS_MATRIX[key1][key2]
        const matchup2 = RPSLS_MATRIX[key2][key1]

        const winningWagerString = wager ? ` ${wager} eggs` : ''

        if (matchup1) {
          void moveMessage.edit({
            embeds: [
              new Embed({
                title: `**${interaction.user.tag}'s and ${opponent.tag}'s RPS game**`,
                description: `${interaction.user.tag} has won${winningWagerString} (${RPSLS_CHOICES[move1]} ${matchup1} ${RPSLS_CHOICES[move2]})!`,
              }),
            ],
            components: [],
          })
          if (wager) await transferEggs(opponent.id, interaction.user.id, wager)
          resolve(CommandResult.Success)
          return
        }

        void moveMessage.edit({
          embeds: [
            new Embed({
              title: `**${interaction.user.tag}'s and ${opponent.tag}'s RPS game**`,
              description: `${opponent.tag} has won${winningWagerString} (${RPSLS_CHOICES[move2]} ${matchup2} ${RPSLS_CHOICES[move1]})!`,
            }),
          ],
          components: [],
        })
        if (wager) await transferEggs(interaction.user.id, opponent.id, wager)
        resolve(CommandResult.Success)
      })
    })
  },
})

export default COMMAND_RPS

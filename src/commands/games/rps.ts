import { DMChannel, Message, MessageActionRow, MessageButton } from 'discord.js'
import { interactionReplySafe } from '../../util/discord.js'
import { Embed } from '../../util/embed.js'
import { duelPlayer } from '../../util/games.js'
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

    const response = await duelPlayer(interaction, options, 'dice', '🎲')

    if (!response) {
      return CommandResult.Success
    }

    const opponent = response.user

    const choices = Object.entries(RPS_CHOICES).map(
      ([name, emoji]) => new MessageButton({ customId: name, emoji, style: 'PRIMARY' })
    )
    const row = new MessageActionRow({ components: choices })

    const link = new MessageActionRow({
      components: [
        new MessageButton({
          style: 'LINK',
          url: ((await response.fetchReply()) as Message).url,
          label: 'Jump to Message',
        }),
      ],
    })

    const askForMove = async (dm: DMChannel): Promise<keyof typeof RPS_CHOICES> => {
      const msg = await dm.send({
        embeds: [Embed.info(`**RPS Game against ${opponent.tag}**`, 'Select your move!')],
        components: [row, link],
      })
      let dmResponse

      try {
        dmResponse = await msg.awaitMessageComponent({
          componentType: 'BUTTON',
          time: 60_000,
        })
      } catch (err) {
        throw new Error(`${dm.recipient.tag} did not respond in time.`)
      }

      void dmResponse.update({
        embeds: [
          Embed.info(
            `**RPS Game against ${opponent.tag}**`,
            `You selected ${RPS_CHOICES[dmResponse.customId as keyof typeof RPS_CHOICES]}!`
          ),
        ],
        components: [link],
      })

      return dmResponse.customId as keyof typeof RPS_CHOICES
    }

    try {
      const [move1, move2] = await Promise.all([
        interaction.user.createDM().then(askForMove),
        opponent.createDM().then(askForMove),
      ])

      const moveString = `${RPS_CHOICES[move1]} vs ${RPS_CHOICES[move2]}`

      if (move1 === move2) {
        await response.editReply({
          embeds: [
            new Embed({
              title: `**${interaction.user.tag}'s and ${opponent.tag}'s RPS game**`,
              description: `The duel was a draw (${moveString})!`,
            }),
          ],
          components: [],
        })
        return CommandResult.Success
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
        await response.editReply({
          embeds: [
            new Embed({
              title: `**${interaction.user.tag}'s and ${opponent.tag}'s RPS game**`,
              description: `${interaction.user.tag} has won (${moveString})!`,
            }),
          ],
          components: [],
        })
        return CommandResult.Success
      }

      await response.editReply({
        embeds: [
          new Embed({
            title: `**${interaction.user.tag}'s and ${opponent.tag}'s RPS game**`,
            description: `${opponent.tag} has won (${moveString})!`,
          }),
        ],
        components: [],
      })
      return CommandResult.Success
    } catch (err) {
      if (err?.message?.includes('did not respond in time')) {
        await response.followUp(err.message)
        return CommandResult.Success
      }
      // if (err?.code === 'INTERACTION_COLLECTOR_ERROR') {
      // }
      // eslint-disable-next-line no-console
      console.log(err)
      await interactionReplySafe(response, {
        embeds: [Embed.error(err)],
      })
      return CommandResult.Failure
    }
  },
})

export default COMMAND_RPS

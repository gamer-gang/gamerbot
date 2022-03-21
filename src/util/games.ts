import { ButtonInteraction, Message, MessageActionRow, MessageButton } from 'discord.js'
import { CommandContext } from '../commands/context.js'
import { Embed } from './embed.js'

export const duelPlayer = async (
  interaction: CommandContext['interaction'],
  options: CommandContext['options'],
  gameName: string,
  emoji: string
): Promise<ButtonInteraction | undefined> => {
  const opponent = options.getUser('user')

  if (opponent == null) {
    await interaction.reply('Unable to resolve user.')
    return
  }

  if (interaction.user === opponent) {
    await interaction.reply('You cant duel yourself, silly.')
    return
  }

  const embed = new Embed({
    title: `${interaction.user.tag} has dueled ${opponent.tag} to a game of ${gameName}!`,
    description: `Click ${emoji} to accept.`,
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
            emoji: emoji,
          }),
        ],
      }),
    ],
  })

  const reply = (await interaction.fetchReply()) as Message

  try {
    const response = await reply
      .awaitMessageComponent({
        componentType: 'BUTTON',
        filter: (i) => i.user.id === opponent.id,
        time: 120_000,
      })
      .catch()

    await response.update({
      embeds: [new Embed(embed).setDescription('Duel accepted!')],
    })

    return response
  } catch (err) {
    await interaction.followUp({
      embeds: [Embed.error('The duel timed out.')],
    })
  }
}

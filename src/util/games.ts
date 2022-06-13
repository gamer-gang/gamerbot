import { ButtonInteraction, Message, MessageActionRow, MessageButton } from 'discord.js'
import type { CommandContext } from '../commands/context.js'
import { Embed } from './embed.js'

export interface ChallengeData {
  button: ButtonInteraction
  message: Message
}

export const challengePlayer = async (
  interaction: CommandContext['interaction'],
  options: CommandContext['options'],
  gameName: string,
  emoji: string
): Promise<ChallengeData | undefined> => {
  const opponent = options.getUser('user')

  if (opponent == null) {
    await interaction.reply({
      embeds: [Embed.error('Cannot resolve user.')],
    })
    return
  }

  if (opponent.bot) {
    await interaction.reply({
      embeds: [Embed.error("You can't duel bots.")],
    })
    return
  }

  if (interaction.user === opponent) {
    await interaction.reply({
      embeds: [Embed.error("You can't duel yourself, silly.")],
    })
    return
  }

  const embed = new Embed({
    title: `${interaction.user.tag} has challenged ${opponent.tag} to a game of ${gameName}!`,
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
      embeds: [new Embed(embed).setDescription('Challenge accepted!')],
    })

    return {
      button: response,
      message: reply,
    }
  } catch (err) {
    await interaction.followUp({
      embeds: [Embed.error('The duel timed out.')],
    })
  }
}

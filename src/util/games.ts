import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ComponentType,
  Message,
} from 'discord.js'
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
  emoji: string,
  wager?: number | null
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

  const wagerString = wager ? ` for ${wager} egg${wager === 1 ? '' : 's'}` : ''
  const embed = new Embed({
    title: `${interaction.user.tag} has challenged ${opponent.tag} to a game of ${gameName}${wagerString}!`,
    description: `Click ${emoji} to accept.`,
  })

  await interaction.reply({
    content: opponent.toString(),
    embeds: [embed],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder({
          customId: 'start',
          style: ButtonStyle.Primary,
          emoji,
        })
      ),
    ],
  })

  const reply = (await interaction.fetchReply()) as Message

  try {
    const response = await reply
      .awaitMessageComponent({
        componentType: ComponentType.Button,
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

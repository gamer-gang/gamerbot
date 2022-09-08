import {
  Interaction,
  InteractionReplyOptions,
  InteractionType,
  MessagePayload,
  User,
} from 'discord.js'
import { DateTime } from 'luxon'

export const getDateStringFromSnowflake = (id: string): [timestamp: string, age: string] => {
  const timestamp = parseInt(id.padStart(18, '0'), 10) / 4194304 + 1420070400000

  const time = DateTime.fromMillis(timestamp)

  return [time.toLocaleString(DateTime.DATETIME_FULL), time.toRelative() as string]
}

export const getDateFromSnowflake = (id: string): DateTime => {
  return DateTime.fromMillis(parseInt(id.padStart(18, '0'), 10) / 4194304 + 1420070400000)
}

export const getProfileImageUrl = (user: User): string => {
  let icon = user.displayAvatarURL({ size: 4096 })
  if (icon.includes('.webp')) {
    icon = user.displayAvatarURL({ size: 4096, extension: 'png' })
  }
  return icon
}

export const interactionReplySafe = async (
  interaction: Interaction,
  content: string | MessagePayload | InteractionReplyOptions
): Promise<void> => {
  if (
    interaction.type === InteractionType.ApplicationCommand ||
    interaction.type === InteractionType.MessageComponent ||
    interaction.type === InteractionType.ModalSubmit
  ) {
    if (interaction.deferred) {
      await interaction.editReply(content)
    } else if (interaction.replied) {
      await interaction.followUp(content)
    } else {
      await interaction.reply(content)
    }
  }
}

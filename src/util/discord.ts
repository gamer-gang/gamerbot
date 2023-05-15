import {
  Interaction,
  InteractionReplyOptions,
  InteractionType,
  MessagePayload,
  User,
} from 'discord.js'
import { DateTime } from 'luxon'

export const getDateStringFromSnowflake = (id: string): [timestamp: string, age: string] => {
  const time = getDateFromSnowflake(id)
  return [time.toLocaleString(DateTime.DATETIME_FULL), time.toRelative() as string]
}

export const getDateFromSnowflake = (id: string): DateTime => {
  const ms = (BigInt(id) >> 22n) + 1420070400000n
  return DateTime.fromMillis(Number(ms))
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

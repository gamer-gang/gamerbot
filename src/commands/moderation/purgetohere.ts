import {
  ApplicationCommandType,
  ChannelType,
  CommandInteraction,
  ContextMenuCommandInteraction,
} from 'discord.js'
import assert from 'node:assert'
import { getDateFromSnowflake } from '../../util/discord.js'
import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'

export const purgeTo = async (
  interaction: CommandInteraction | ContextMenuCommandInteraction,
  to: string
): Promise<CommandResult> => {
  const timestamp = getDateFromSnowflake(to).toMillis()

  assert(interaction.channel)
  assert(interaction.channel.type !== ChannelType.DM)

  while (getDateFromSnowflake(interaction.channel.lastMessage?.id ?? '0').toMillis() > timestamp) {
    const messages = await interaction.channel.messages.fetch({ limit: 100 })

    const toDelete = messages.filter(
      (message) => getDateFromSnowflake(message.id ?? '0').toMillis() > timestamp
    )
    if (toDelete.size === 0) break

    const deleted = await interaction.channel.bulkDelete(toDelete.size, true)
    if (deleted.size < toDelete.size) {
      await interaction.followUp({
        embeds: [Embed.error('Could not delete messages older than 14 days.')],
        ephemeral: true,
      })
      break
    }

    await interaction.channel.fetch()
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return CommandResult.Success
}

const COMMAND_PURGETOHERE = command(ApplicationCommandType.Message, {
  name: 'Purge to here',
  description: 'Purge all messages newer than this message.',
  guildOnly: true,
  logUsage: true,
  userPermissions: ['ManageMessages'],
  botPermissions: ['ManageMessages'],

  async run(context) {
    const { interaction } = context

    const message = context.targetMessage

    await interaction.reply({
      embeds: [Embed.info('Purging...')],
      ephemeral: true,
    })
    await purgeTo(interaction, message.id)
    await interaction.editReply({
      embeds: [Embed.success(`Purged messages newer than ${message.url}`)],
    })

    return CommandResult.Success
  },
})

export default COMMAND_PURGETOHERE

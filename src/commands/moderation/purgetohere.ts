import type { CommandInteraction, ContextMenuInteraction } from 'discord.js'
import assert from 'node:assert'
import { getDateFromSnowflake } from '../../util/discord.js'
import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'

export const purgeTo = async (
  interaction: CommandInteraction | ContextMenuInteraction,
  to: string
): Promise<CommandResult> => {
  const timestamp = getDateFromSnowflake(to)

  assert(interaction.channel)
  assert(interaction.channel.type !== 'DM')

  while (getDateFromSnowflake(interaction.channel.lastMessage?.id ?? '0') > timestamp) {
    const messages = await interaction.channel.messages.fetch({ limit: 200 })

    const toDelete = messages.filter((message) => message.createdTimestamp > timestamp.toMillis())
    if (toDelete.size === 0) break

    const deleted = await interaction.channel.bulkDelete(200, true)
    if (deleted.size < toDelete.size) {
      await interaction.followUp({
        embeds: [Embed.error('Could not delete messages older than 14 days')],
        ephemeral: true,
      })
      break
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return CommandResult.Success
}

const COMMAND_PURGETOHERE = command('MESSAGE', {
  name: 'Purge to here',
  description: 'Purge all messages newer than this message.',
  guildOnly: true,
  logUsage: true,
  userPermissions: ['MANAGE_MESSAGES'],
  botPermissions: ['MANAGE_MESSAGES'],

  async run(context) {
    const { interaction } = context

    const message = context.targetMessage

    return await purgeTo(interaction, message.id)
  },
})

export default COMMAND_PURGETOHERE

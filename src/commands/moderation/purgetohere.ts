import { CommandInteraction, ContextMenuInteraction } from 'discord.js'
import { GuildRequired } from '../../types.js'
import { getDateFromSnowflake } from '../../util/discord.js'
import { Embed } from '../../util/embed.js'
import command from '../command.js'

export const purgeTo = async (
  interaction: (CommandInteraction | ContextMenuInteraction) & GuildRequired,
  to: string
): Promise<void> => {
  const timestamp = getDateFromSnowflake(to)

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
}

const COMMAND_PURGETOHERE = command('MESSAGE', {
  name: 'Purge to here',
  guildOnly: true,

  async run(context) {
    const { interaction } = context

    const message = context.targetMessage

    return await purgeTo(interaction, message.id)
  },
})

export default COMMAND_PURGETOHERE

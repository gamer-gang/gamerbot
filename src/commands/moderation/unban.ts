import { Embed } from '../../util/embed.js'
import { findErrorMessage } from '../../util/message.js'
import command from '../command.js'

const COMMAND_UNBAN = command('CHAT_INPUT', {
  name: 'unban',
  description: 'Unban a user.',
  guildOnly: true,
  logUsage: true,
  options: [
    {
      name: 'user',
      description: 'User to ban',
      type: 'USER',
      required: true,
    },
    {
      name: 'reason',
      description: 'Ban reason',
      type: 'STRING',
    },
  ],

  async run(context) {
    const { interaction, client, options } = context

    const input = options.getUser('user')
    const reason = options.getString('reason')

    if (input == null) {
      return await interaction.reply({
        embeds: [Embed.error('Expected a user (and optionally reason)')],
      })
    }

    const user =
      client.users.resolve(input) ??
      client.users.resolve(input.toString().replace(/<@!?(\d+)>/g, '$1')) ??
      input.toString().replace(/<@!?(\d+)>/g, '$1')

    if (user == null) {
      return await interaction.reply({
        embeds: [Embed.error('Could not resolve user')],
        ephemeral: true,
      })
    }

    if (interaction.guild == null) {
      return await interaction.reply({
        embeds: [Embed.error('Could not resolve guild')],
        ephemeral: true,
      })
    }

    const unbanner = interaction.guild.members.resolve(interaction.user.id)!

    try {
      await interaction.guild.members.unban(
        user,
        `${unbanner.user.tag} (${unbanner.id}) used unban command${
          reason != null ? `: '${reason}'` : ' (no reason provided)'
        }`
      )

      await interaction.reply({
        embeds: [Embed.success(`${user.toString()} unbanned`)],
        ephemeral: true,
      })
    } catch (err) {
      client.logger.error(err)
      await interaction.reply({ embeds: [Embed.error(findErrorMessage(err))], ephemeral: true })
    }
  },
})

export default COMMAND_UNBAN

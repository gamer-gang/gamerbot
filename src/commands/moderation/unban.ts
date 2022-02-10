import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'

const COMMAND_UNBAN = command('CHAT_INPUT', {
  name: 'unban',
  description: 'Unban a user.',
  guildOnly: true,
  logUsage: true,
  userPermissions: ['BAN_MEMBERS'],
  botPermissions: ['BAN_MEMBERS'],
  examples: [
    {
      options: { user: { mention: 'Frog' }, reason: 'foo bar baz' },
      description: 'Unban @Frog given a reason.',
    },
    {
      options: { user: { mention: 'Frog' } },
      description: 'Unban @Frog without a reason.',
    },
  ],
  options: [
    {
      name: 'user',
      description: 'User to ban.',
      type: 'USER',
      required: true,
    },
    {
      name: 'reason',
      description: 'Unban reason.',
      type: 'STRING',
    },
  ],

  async run(context) {
    const { interaction, client, options } = context

    const input = options.getUser('user')
    const reason = options.getString('reason')

    if (input == null) {
      await interaction.reply({
        embeds: [Embed.error('Expected a user (and optionally reason)')],
      })
      return CommandResult.Success
    }

    const user =
      client.users.resolve(input) ??
      client.users.resolve(input.toString().replace(/<@!?(\d+)>/g, '$1')) ??
      input.toString().replace(/<@!?(\d+)>/g, '$1')

    if (user == null) {
      await interaction.reply({
        embeds: [Embed.error('Could not resolve user')],
        ephemeral: true,
      })
      return CommandResult.Success
    }

    if (interaction.guild == null) {
      await interaction.reply({
        embeds: [Embed.error('Could not resolve guild')],
        ephemeral: true,
      })
      return CommandResult.Success
    }

    const unbanner = interaction.guild.members.resolve(interaction.user.id)!

    try {
      await interaction.guild.members.unban(
        user,
        `${unbanner.user.tag} (${unbanner.id}) used /unban${
          reason != null ? `: '${reason}'` : ' (no reason provided)'
        }`
      )

      await interaction.reply({
        embeds: [Embed.success(`${user.toString()} unbanned`)],
        ephemeral: true,
      })
      return CommandResult.Success
    } catch (err) {
      client.getLogger('/unban').error(err)
      await interaction.reply({ embeds: [Embed.error(err)], ephemeral: true })
      return CommandResult.Failure
    }
  },
})

export default COMMAND_UNBAN

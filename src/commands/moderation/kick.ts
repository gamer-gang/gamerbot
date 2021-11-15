import { Embed } from '../../util/embed.js'
import command from '../command.js'

const COMMAND_KICK = command('CHAT_INPUT', {
  name: 'kick',
  description: 'Ban a user.',
  guildOnly: true,
  logUsage: true,
  options: [
    {
      name: 'user',
      description: 'User to kick.',
      type: 'USER',
      required: true,
    },
    {
      name: 'reason',
      description: 'Kick reason.',
      type: 'STRING',
    },
  ],
  async run(context) {
    const { interaction } = context

    if (context.guild == null) {
      return await interaction.reply('You can only ban users in a guild.')
    }

    const user = interaction.options.getUser('user')
    const reason = interaction.options.getString('reason')

    if (user == null) {
      return await interaction.reply({
        embeds: [Embed.error('Could not resolve user.')],
      })
    }

    if (interaction.guild == null) {
      await interaction.reply({ embeds: [Embed.error('Could not resolve guild.')] })
      return
    }

    try {
      const kickee = interaction.guild.members.resolve(user)

      if (kickee == null) {
        await interaction.reply({
          embeds: [Embed.error('User not in server')],
          ephemeral: true,
        })
        return
      }

      const kicker = interaction.guild.members.resolve(interaction.user.id)!

      if (kicker.roles.highest.comparePositionTo(kickee.roles.highest) <= 0) {
        await interaction.reply({
          embeds: [Embed.error('You cannot kick that member')],
          ephemeral: true,
        })
        return
      }

      if (interaction.guild.me!.roles.highest.comparePositionTo(kickee.roles.highest) <= 0) {
        await interaction.reply({
          embeds: [Embed.error('gamerbot cannot kick that member')],
          ephemeral: true,
        })
        return
      }

      if (!kickee.kickable) {
        await interaction.reply({
          embeds: [Embed.error('Member cannot be kicked by gamerbot')],
          ephemeral: true,
        })
        return
      }

      await kickee.kick(
        `${kicker.user.tag} (${kicker.id}) used kick command${
          reason != null ? `: '${reason}'` : ' (no reason provided)'
        }`
      )

      await interaction.reply({
        embeds: [
          Embed.success(
            `${kickee.user.tag} was kicked`,
            reason != null ? `Reason: ${reason}` : undefined
          ),
        ],
      })
    } catch (err) {
      await interaction.reply({ embeds: [Embed.error(err.message)], ephemeral: true })
    }
  },
})

export default COMMAND_KICK

import { Embed } from '../../util/embed.js'
import command from '../command.js'

const COMMAND_BAN = command('CHAT_INPUT', {
  name: 'ban',
  description: 'Ban a user.',
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
      const banner = interaction.guild.members.resolve(interaction.user.id)!
      const bannee = interaction.guild.members.resolve(user)

      if (bannee == null) {
        await interaction.reply({
          embeds: [Embed.error('User not in guild')],
          ephemeral: true,
        })
        return
      }

      if (banner.roles.highest.comparePositionTo(bannee.roles.highest) <= 0) {
        await interaction.reply({
          embeds: [Embed.error('You cannot ban that member')],
          ephemeral: true,
        })
        return
      }

      if (context.guild.me!.roles.highest.comparePositionTo(bannee.roles.highest) <= 0) {
        await interaction.reply({
          embeds: [Embed.error('gamerbot cannot ban that member')],
          ephemeral: true,
        })
        return
      }

      if (!bannee.bannable) {
        await interaction.reply({
          embeds: [Embed.error('Member is not bannable by gamerbot')],
          ephemeral: true,
        })
        return
      }

      await bannee.ban({
        reason: `${banner.user.tag} (${banner.id}) used ban command${
          reason != null ? `: '${reason}'` : ' (no reason provided)'
        }`,
      })

      await interaction.reply({
        embeds: [
          Embed.success(
            `${bannee.user.tag} was banned`,
            reason != null ? `Reason: ${reason}` : undefined
          ),
        ],
      })
    } catch (err) {
      await interaction.reply({ embeds: [Embed.error(err.message)], ephemeral: true })
    }
  },
})

export default COMMAND_BAN

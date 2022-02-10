import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'

const COMMAND_BAN = command('CHAT_INPUT', {
  name: 'ban',
  description: 'Ban a user.',
  longDescription: 'Permanently ban a user from the server.',
  guildOnly: true,
  logUsage: true,
  userPermissions: ['BAN_MEMBERS'],
  botPermissions: ['BAN_MEMBERS'],
  examples: [
    {
      options: { user: { mention: 'Frog' }, reason: 'Spamming' },
      description: 'Ban @Frog for spamming.',
    },
    {
      options: { user: { mention: 'Frog' } },
      description: 'Ban @Frog without a reason.',
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
      description: 'Ban reason.',
      type: 'STRING',
    },
  ],

  async run(context) {
    const { interaction, options, client } = context

    if (context.guild == null) {
      await interaction.reply('You can only ban users in a guild.')
      return CommandResult.Success
    }

    const user = options.getUser('user')
    const reason = options.getString('reason')

    if (user == null) {
      await interaction.reply({
        embeds: [Embed.error('Could not resolve user.')],
      })
      return CommandResult.Success
    }

    if (interaction.guild == null) {
      await interaction.reply({ embeds: [Embed.error('Could not resolve guild.')] })
      return CommandResult.Success
    }

    try {
      const banner = interaction.guild.members.resolve(interaction.user.id)!
      const bannee = interaction.guild.members.resolve(user)

      if (bannee == null) {
        await interaction.reply({
          embeds: [Embed.error('User not in guild')],
          ephemeral: true,
        })
        return CommandResult.Success
      }

      if (banner.roles.highest.comparePositionTo(bannee.roles.highest) <= 0) {
        await interaction.reply({
          embeds: [Embed.error('You cannot ban that member')],
          ephemeral: true,
        })
        return CommandResult.Success
      }

      if (context.guild.me!.roles.highest.comparePositionTo(bannee.roles.highest) <= 0) {
        await interaction.reply({
          embeds: [Embed.error('gamerbot cannot ban that member')],
          ephemeral: true,
        })
        return CommandResult.Success
      }

      if (!bannee.bannable) {
        await interaction.reply({
          embeds: [Embed.error('Member is not bannable by gamerbot')],
          ephemeral: true,
        })
        return CommandResult.Success
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
      return CommandResult.Success
    } catch (err) {
      client.getLogger('/ban').error(err)
      await interaction.reply({ embeds: [Embed.error(err)], ephemeral: true })
      return CommandResult.Failure
    }
  },
})

export default COMMAND_BAN

import { getDateStringFromSnowflake } from '../../util/discord.js'
import { Embed } from '../../util/embed.js'
import command from '../command.js'

const COMMAND_SERVERINFO = command('CHAT_INPUT', {
  name: 'serverinfo',
  description: 'Get information about a server.',
  options: [
    {
      name: 'server',
      description: 'Server to show info for',
      type: 'STRING',
    },
  ],

  async run(context) {
    const { interaction, client } = context

    const input = interaction.options.getString('server')

    if (input == null && interaction.guild == null) {
      await interaction.reply('You must specify a server to show icon for.')
      return
    }

    const guild = input != null ? client.guilds.resolve(input) : interaction.guild

    if (guild == null) {
      await interaction.reply(`Could not find server with ID or name "${input ?? '<unknown>'}".`)
      return
    }

    const bots = [...(await guild.members.fetch()).values()].filter(
      (member) => member.user.bot
    ).length
    let icon = guild.iconURL({ dynamic: true, size: 4096 })
    if (icon?.includes('.webp') ?? false) {
      icon = guild.iconURL({ format: 'png', size: 4096 })
    }

    const owner = await guild.fetchOwner()
    const embed = new Embed({
      author: {
        iconURL: icon ?? undefined,
        name: guild.name,
      },
      title: 'Server info',
      description: icon != null ? undefined : 'No icon set',
    })
      .addField('Creation date', getDateStringFromSnowflake(guild.id).join('; '))
      .addField(
        'Owner',
        guild === interaction.guild ? owner.toString() : `${owner.user.tag} (${owner.id})`
      )
      .addField(
        'Members',
        `${guild.memberCount} members (${guild.memberCount - bots} users, ${bots} bots)`
      )
      .addField('ID', guild.id)
      .setTimestamp()

    icon != null && embed.setThumbnail(icon)

    await interaction.reply({ embeds: [embed] })
  },
})

export default COMMAND_SERVERINFO

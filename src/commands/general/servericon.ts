import { Embed } from '../../util/embed.js'
import command from '../command.js'

const COMMAND_SERVERICON = command('CHAT_INPUT', {
  name: 'servericon',
  description: 'Get icon for a server.',
  options: [
    {
      name: 'server',
      description: 'Server to show icon for',
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

    let icon = guild.iconURL({ dynamic: true, size: 4096 })
    if (icon?.includes('.webp') ?? false) {
      icon = guild.iconURL({ format: 'png', size: 4096 })
    }

    if (icon == null) {
      await interaction.reply({ embeds: [Embed.info('Server has no icon set')] })
      return
    }

    const embed = new Embed({
      author: {
        iconURL: icon ?? undefined,
        name: guild.name,
      },
      title: 'Server icon',
      image: { url: icon },
    })

    await interaction.reply({ embeds: [embed] })
  },
})

export default COMMAND_SERVERICON

import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js'
import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'

const COMMAND_SERVERICON = command(ApplicationCommandType.ChatInput, {
  name: 'servericon',
  description: 'Get icon for a server.',
  examples: [
    {
      options: {},
      description: 'Get icon for the current server.',
    },
    {
      options: { server: '222078108977594368' }, // discord.js server
      description: 'Show icon for server with ID 222078108977594368.',
    },
  ],
  options: [
    {
      name: 'server',
      description: 'Server to show icon for.',
      type: ApplicationCommandOptionType.String,
    },
  ],

  async run(context) {
    const { interaction, client, options } = context

    const input = options.getString('server')

    if (input == null && interaction.guild == null) {
      await interaction.reply('You must specify a server to show icon for.')
      return CommandResult.Success
    }

    const guild = input != null ? client.guilds.resolve(input) : interaction.guild

    if (guild == null) {
      await interaction.reply(`Could not find server with ID or name "${input ?? '<unknown>'}".`)
      return CommandResult.Success
    }

    let icon = guild.iconURL({ size: 4096 })
    if (icon?.includes('.webp')) {
      icon = guild.iconURL({ size: 4096, extension: 'png' })
    }

    if (icon == null) {
      await interaction.reply({ embeds: [Embed.info('Server has no icon set')] })
      return CommandResult.Success
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
    return CommandResult.Success
  },
})

export default COMMAND_SERVERICON

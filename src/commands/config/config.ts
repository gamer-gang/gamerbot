import { ApplicationCommandOptionData } from 'discord.js'
import command from '../command.js'
import { ConfigOption } from './_configOption.js'

const CONFIG_OPTIONS: ConfigOption[] = []

const COMMAND_CONFIG = command('CHAT_INPUT', {
  name: 'config',
  description: 'Manage gamerbot server configuration.',
  guildOnly: true,
  logUsage: true,
  userPermissions: ['MANAGE_GUILD'],
  options: [
    ...CONFIG_OPTIONS.map((optionDef) => {
      const option: ApplicationCommandOptionData = {
        name: optionDef.internalName,
        description: optionDef.description,
        type: 'SUB_COMMAND',
        options: [
          {
            name: 'value',
            description: 'The value to set the option to.',
            type: optionDef.type,
          },
        ],
      }

      return option
    }),
  ],

  async run(context) {
    const { interaction } = context

    await interaction.reply('hi')
  },
})

export default COMMAND_CONFIG

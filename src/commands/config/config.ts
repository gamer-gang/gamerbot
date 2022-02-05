import {
  ApplicationCommandNonOptionsData,
  ApplicationCommandOptionChoice,
  ApplicationCommandOptionData,
} from 'discord.js'
import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'
import { ConfigOption, ConfigValueType, helpers } from './_configOption.js'
import CONFIG_OPTION_ENABLEEGG from './_enableEgg.js'

const CONFIG_OPTIONS: Array<ConfigOption<ConfigValueType>> = [
  // CONFIG_OPTION_ALLOWSPAM,
  CONFIG_OPTION_ENABLEEGG,
  // CONFIG_OPTION_LOGCHANNELS,
]

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
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          {
            name: 'value',
            description: 'The value to set the option to. Leave blank to view the current value.',
            type: optionDef.type,
            choices: (optionDef as unknown as { choices: ApplicationCommandOptionChoice[] })
              .choices,
          } as ApplicationCommandNonOptionsData,
        ],
      }

      return option
    }),
  ],

  async run(context) {
    const { interaction, options } = context

    const optionName = options.getSubcommand()

    const option = CONFIG_OPTIONS.find((optionDef) => optionDef.internalName === optionName)

    if (option == null) {
      await interaction.reply({
        embeds: [Embed.error(`Unknown option: ${optionName}`)],
        ephemeral: true,
      })
      return CommandResult.Success
    }

    return await option.handle(context, helpers(context))
  },
})

export default COMMAND_CONFIG

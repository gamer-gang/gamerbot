import { Embed } from '../../util/embed.js'
import { CommandResult } from '../command.js'
import { configOption } from './_configOption.js'

const CONFIG_OPTION_ALLOWSPAM = configOption({
  internalName: 'allow-spam',
  displayName: 'allow spam commands',
  description: 'Allow spam commands like /lorem.',
  type: 'BOOLEAN',

  async handle(context, { getValue, getConfig, updateConfig }) {
    const { interaction } = context

    const value = getValue()
    const config = await getConfig()

    if (value == null) {
      await interaction.reply({
        embeds: [Embed.info(`allow-spam is currently set to **${config.allowSpam}**.`)],
      })
      return CommandResult.Success
    }

    await updateConfig({ allowSpam: value })

    await interaction.reply({
      embeds: [Embed.success(`allow-spam has been set to **${value}**.`)],
    })

    return CommandResult.Success
  },
})

export default CONFIG_OPTION_ALLOWSPAM

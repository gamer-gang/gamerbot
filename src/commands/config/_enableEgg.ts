import { ApplicationCommandOptionType } from 'discord.js'
import { Embed } from '../../util/embed.js'
import { CommandResult } from '../command.js'
import { configOption } from './_configOption.js'

const CONFIG_OPTION_ENABLEEGG = configOption({
  internalName: 'enable-egg',
  displayName: 'enable egg reactions',
  description: 'Enable gamerbot egg reactions.',
  type: ApplicationCommandOptionType.Boolean,

  async handle(context, { getValue, getConfig, updateConfig }) {
    const { interaction } = context

    const value = getValue()
    const config = await getConfig()

    if (value == null) {
      await interaction.reply({
        embeds: [Embed.info(`enable-egg is currently set to **${config.egg}**.`)],
      })
      return CommandResult.Success
    }

    await updateConfig({ egg: value })

    await interaction.reply({
      embeds: [Embed.success(`enable-egg has been set to **${value}**.`)],
    })

    return CommandResult.Success
  },
})

export default CONFIG_OPTION_ENABLEEGG

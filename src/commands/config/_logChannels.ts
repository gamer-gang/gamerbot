import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  SelectMenuBuilder,
} from 'discord.js'
import assert from 'node:assert'
import { IS_DEVELOPMENT } from '../../constants.js'
import { prisma } from '../../prisma.js'
import { Embed } from '../../util/embed.js'
import { CommandResult } from '../command.js'
import { configOption } from './_configOption.js'
import addLogChannel from './_log/addLogChannel.js'
import editLogChannel from './_log/editLogChannel.js'
import removeLogChannel from './_log/removeLogChannel.js'

const CONFIG_OPTION_LOGCHANNELS = configOption({
  internalName: 'log-channels',
  displayName: 'log channels',
  description: 'Log channels to use for the bot.',
  type: ApplicationCommandOptionType.String,
  choices: [{ name: 'edit', value: 'edit' }],

  async handle(context, { getValue, getConfig, updateConfig }) {
    const { interaction } = context

    const value = getValue()
    const config = await getConfig()

    const logChannels = await prisma.logChannel.findMany({
      where: { guildId: config.guildId },
    })

    const embed = new Embed({
      title: `Log channels for ${interaction.guild.name}`,
    })

    if (logChannels.length !== 0) {
      embed.description = 'The following channels are currently configured as log channels:'
      embed.addFields(
        logChannels.map((logChannel) => ({
          name: `<#${logChannel.channelId}>`,
          value: logChannel.subscribedEvents.toString(),
        }))
      )
    } else {
      embed.description = 'No log channels are currently configured.'
    }

    // generate a random id to keep track of this menu
    const menuId = Math.random().toString(36).substring(2, 15)

    if (value !== 'edit') {
      await interaction.reply({ embeds: [embed] })
      return CommandResult.Success
    }

    const components: (ActionRowBuilder<ButtonBuilder> | ActionRowBuilder<SelectMenuBuilder>)[] = []

    components.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder({
          customId: `add_${menuId}`,
          label: 'Add',
          emoji: '➕',
          style: ButtonStyle.Success,
        })
      ),
      ...(logChannels.length > 0
        ? [
            new ActionRowBuilder<SelectMenuBuilder>().addComponents(
              new SelectMenuBuilder({
                maxValues: 1,
                minValues: 1,
                customId: `remove_${menuId}`,
                placeholder: '➖ Remove...',
                options: logChannels.map((logChannel) => ({
                  label: `<#${logChannel.channelId}>`,
                  value: logChannel.channelId,
                })),
              })
            ),
            new ActionRowBuilder<SelectMenuBuilder>().addComponents(
              new SelectMenuBuilder({
                maxValues: 1,
                minValues: 1,
                customId: `edit_${menuId}`,
                placeholder: '🖋 Edit...',
                options: logChannels.map((logChannel) => ({
                  label: `<#${logChannel.channelId}>`,
                  value: logChannel.channelId,
                })),
              })
            ),
          ]
        : [])
    )

    // show the menu id in the footer in dev mode
    if (IS_DEVELOPMENT) {
      embed.setFooter({ text: `Menu ID: ${menuId}` })
    }

    await interaction.reply({
      embeds: [embed],
      components: components,
    })

    const reply = interaction.channel.messages.resolve((await interaction.fetchReply()).id)!

    const collector = reply.createMessageComponentCollector({
      filter: (component) => component.customId.endsWith(`_${menuId}`),
    })

    return await new Promise<CommandResult>((resolve) => {
      collector.on('collect', (component) => {
        // parse the custom id to get the action
        const action = component.customId.split('_')[0]

        if (action === 'add') {
          // TODO
          assert(component.isButton())
          void component.update({ components: [] })
          collector.stop()
          resolve(addLogChannel(context, logChannels, component))
        } else if (action === 'remove') {
          // TODO
          assert(component.isSelectMenu())
          void component.update({ components: [] })
          collector.stop()
          resolve(removeLogChannel(context, logChannels, component))
        } else if (action === 'edit') {
          // TODO
          assert(component.isSelectMenu())
          void component.update({ components: [] })
          collector.stop()
          resolve(editLogChannel(context, logChannels, component))
        } else {
          void component.update({ embeds: [Embed.error('Invalid action.')], components: [] })
          throw new Error(`Unknown action: ${action}`)
        }
      })
    })
  },
})

export default CONFIG_OPTION_LOGCHANNELS

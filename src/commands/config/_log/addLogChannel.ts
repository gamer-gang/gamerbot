import type { LogChannel } from '@prisma/client'
import didYouMean from 'didyoumean'
import {
  ButtonInteraction,
  GuildTextBasedChannel,
  MessageActionRow,
  MessageButton,
} from 'discord.js'
import { Embed } from '../../../util/embed.js'
import { CommandResult } from '../../command.js'
import type { CommandContextWithGuild } from '../_configOption.js'

const addLogChannel = async (
  context: CommandContextWithGuild,
  logChannels: LogChannel[],
  component: ButtonInteraction
): Promise<CommandResult> => {
  const { interaction } = context
  const { guild, user } = interaction

  // ask for the channel to add
  const collector = component.channel!.createMessageCollector({
    filter: (message) => message.author.id === user.id,
    idle: 30000,
  })

  await component.editReply({
    embeds: [
      new Embed({
        title: 'Add log channel',
        description: 'What channel would you like to add?',
        footer: { text: 'Type a channel name, mention, or ID.' },
      }),
    ],
  })

  collector.on('collect', async (message) => {
    // parse the channel
    let channel: GuildTextBasedChannel = guild.channels.resolve(
      message.content
    ) as GuildTextBasedChannel

    if (channel == null) {
      // find by mention
      channel = guild.channels.resolve(
        message.mentions.channels.first() as GuildTextBasedChannel
      ) as GuildTextBasedChannel
    }

    if (channel == null) {
      // find by name
      const names = guild.channels.cache
        .filter((c) => c.type === 'GUILD_NEWS' || c.type === 'GUILD_TEXT')
        .map((c) => c.name)

      const match = names.find((name) => name === message.content)

      if (match != null) {
        channel = guild.channels.cache.find(
          (c) => c.type === 'GUILD_NEWS' || (c.type === 'GUILD_TEXT' && c.name === match)
        ) as GuildTextBasedChannel
      } else {
        const bestMatch = didYouMean(message.content, names)

        if (bestMatch == null) {
          await component.editReply({
            embeds: [Embed.error('Could not find a channel by that name.')],
          })
          return
        }

        const menuId = Math.random().toString(36).substring(2, 15)

        await component.editReply({
          embeds: [Embed.error(`Did you mean ${bestMatch}?`)],
          components: [
            new MessageActionRow({
              components: [
                new MessageButton({
                  customId: `yes_${menuId}`,
                  label: 'Yes',
                  emoji: '✅',
                  style: 'SUCCESS',
                }),
                new MessageButton({
                  customId: `no_${menuId}`,
                  label: 'No',
                  emoji: '❌',
                  style: 'DANGER',
                }),
              ],
            }),
          ],
        })

        const reply = interaction.channel.messages.resolve((await interaction.fetchReply()).id)!

        const response = await reply.awaitMessageComponent({
          filter: (component) => component.customId.endsWith(`_${menuId}`),
          time: 120000,
        })

        if (response.customId.startsWith('no_')) {
          await component.editReply({
            embeds: [Embed.error('Could not find a channel by that name.')],
            components: [],
          })
          return
        }

        // eslint-disable-next-line require-atomic-updates
        channel = guild.channels.cache.find(
          (c) => c.type === 'GUILD_NEWS' || (c.type === 'GUILD_TEXT' && c.name === bestMatch)
        ) as GuildTextBasedChannel
      }
    }

    if (channel == null) {
      await component.editReply({
        embeds: [Embed.error('Invalid channel.')],
        components: [],
      })
      return
    }

    if (channel.isThread()) {
      await component.editReply({
        embeds: [Embed.error('Cannot use a thread as log channel.')],
      })
      return
    }

    if (channel.type !== 'GUILD_NEWS' && channel.type !== 'GUILD_TEXT') {
      await component.editReply({
        embeds: [
          Embed.error(
            'Invalid channel. Only text and announcement channels can be used as log channels.'
          ),
        ],
      })
      return
    }

    // check if the channel is already in the config
    if (logChannels.find((logChannel) => logChannel.channelId === channel.id) != null) {
      await component.editReply({
        embeds: [Embed.error('This channel is already in the config.')],
      })
    }

    message.deletable && message.delete()

    // ask for events to log
    await component.editReply({
      embeds: [
        new Embed({
          title: 'Add log channel',
          description: 'What events would you like to log?',
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          fields: [{ name: 'Selected channel', value: channel.toString() }],
          footer: {
            text: 'Type a comma-separated list of event names, or a number representing the events you would like to log.',
          },
        }),
      ],
    })
  })

  // TODO
  // const response = await interaction.channel.awaitMessages({})

  return CommandResult.Success
}

export default addLogChannel

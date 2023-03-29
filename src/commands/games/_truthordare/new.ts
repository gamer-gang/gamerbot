/* eslint-disable require-atomic-updates */
import { TODPlayerOrder } from '@prisma/client'
import { stripIndent } from 'common-tags'
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ComponentType,
  GuildMember,
  InteractionReplyOptions,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
  userMention,
} from 'discord.js'
import assert from 'node:assert'
import { TruthOrDareGame } from '../../../client/TruthOrDareGame.js'
import { Embed } from '../../../util/embed.js'
import { CommandResult } from '../../command.js'
import { CommandContext } from '../../context.js'

enum CreatorOptions {
  Start = 'start',
  Cancel = 'cancel',
  // Mode = 'mode',
  MaxPlayers = 'max-players',
  // AskTimeout = 'ask-timeout',
  // RespondTimeout = 'respond-timeout',
  PlayerOrder = 'player-order',
  // Rounds = 'rounds',
  // Autorole = 'autorole',
  // Autopin = 'autopin',
}

enum PlayerOptions {
  Join = 'join',
  Leave = 'leave',
}

export const truthOrDareNew = async (context: CommandContext): Promise<CommandResult> => {
  const { interaction, client, channel, user, member } = context
  const { tod } = client
  assert(channel?.type === ChannelType.GuildText)

  if (await checkPermissions(context)) {
    return CommandResult.Success
  }

  const game = await tod.create(context, channel, member as GuildMember)
  const message = await interaction.reply(makeNewMessage(game))

  const collector = message.createMessageComponentCollector({
    time: game.config.prepareTimeout,
    dispose: true,
  })

  collector.on('collect', async (i) => {
    if (i.isStringSelectMenu()) {
      if (i.user.id !== user.id) {
        await i.reply({
          embeds: [
            Embed.error("This isn't your game! Only the creator can change the game settings."),
          ],
          ephemeral: true,
        })
        return
      }

      switch (i.values[0]) {
        case CreatorOptions.Start:
          collector.stop(CreatorOptions.Start)
          break
        case CreatorOptions.Cancel:
          collector.stop(CreatorOptions.Cancel)
          break
        // case CreatorOptions.Mode: {
        //   const msg = await i.reply({
        //     embeds: [Embed.info('Select a game mode.').setFooter({ text: 'Timeout: 30s' })],
        //     ephemeral: true,
        //     components: [
        //       new ActionRowBuilder<ButtonBuilder>().addComponents(
        //         new ButtonBuilder()
        //           .setCustomId(TODGameMode.Normal)
        //           .setLabel('Truth or dare')
        //           .setStyle(ButtonStyle.Primary),
        //         new ButtonBuilder()
        //           .setCustomId(TODGameMode.TruthOnly)
        //           .setLabel('Truth only')
        //           .setStyle(ButtonStyle.Primary),
        //         new ButtonBuilder()
        //           .setCustomId(TODGameMode.DareOnly)
        //           .setLabel('Dare only')
        //           .setStyle(ButtonStyle.Primary)
        //       ),
        //     ],
        //   })

        //   const modeInteraction = await msg.awaitMessageComponent({
        //     filter: (interaction) => interaction.user.id === user.id,
        //     time: 30 * 1000,
        //     componentType: ComponentType.Button,
        //   })

        //   if (modeInteraction) {
        //     game.localConfig.gameMode = modeInteraction.customId as TODGameMode
        //     await modeInteraction.update({
        //       embeds: [Embed.success(`Game mode changed to **${modeInteraction.customId}**`)],
        //       components: [],
        //     })
        //     await interaction.editReply(makeNewMessage(game))
        //   } else {
        //     await i.editReply({
        //       embeds: [Embed.error('Timed out.')],
        //       components: [],
        //     })
        //   }
        //   break
        // }
        case CreatorOptions.MaxPlayers: {
          await i.showModal({
            customId: 'max-players-modal',
            title: 'Change max players',
            components: [
              new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder()
                  .setCustomId('max-players')
                  .setPlaceholder(game.config.maxPlayers.toString())
                  .setMinLength(1)
                  .setMaxLength(2)
                  .setStyle(TextInputStyle.Short)
                  .setLabel('Max players (2-25)')
              ),
            ],
          })

          // TODO: move to global, we can't enforce a timeout here
          const modalInteraction = await i.awaitModalSubmit({
            time: 60 * 60 * 1000,
            dispose: true,
            filter: (interaction) => interaction.user.id === user.id,
          })

          if (modalInteraction) {
            const value = modalInteraction.fields.getTextInputValue('max-players')
            const maxPlayers = parseInt(value)
            if (!isNaN(maxPlayers)) {
              game.localConfig.maxPlayers = maxPlayers
              await modalInteraction.reply({
                embeds: [Embed.success(`Max players changed to **${maxPlayers}**`)],
                components: [],
                ephemeral: true,
              })
              await interaction.editReply(makeNewMessage(game))
            } else {
              await modalInteraction.reply({
                embeds: [Embed.error('Invalid number.')],
                components: [],
                ephemeral: true,
              })
            }
          } else {
            await i.reply({
              embeds: [Embed.error('Timed out.')],
              components: [],
              ephemeral: true,
            })
          }

          break
        }
        // case CreatorOptions.AskTimeout:
        //   break
        // case CreatorOptions.RespondTimeout:
        //   break
        case CreatorOptions.PlayerOrder: {
          const msg = await i.reply({
            embeds: [Embed.info('Select a player order.').setFooter({ text: 'Timeout: 30s' })],
            ephemeral: true,
            components: [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setCustomId(TODPlayerOrder.Random)
                  .setLabel('Random')
                  .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                  .setCustomId(TODPlayerOrder.OldestFirst)
                  .setLabel('Oldest first')
                  .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                  .setCustomId(TODPlayerOrder.YoungestFirst)
                  .setLabel('Youngest first')
                  .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                  .setCustomId(TODPlayerOrder.Manual)
                  .setLabel('Manual')
                  .setStyle(ButtonStyle.Primary)
              ),
            ],
          })

          const orderInteraction = await msg.awaitMessageComponent({
            filter: (interaction) => interaction.user.id === user.id,
            time: 30 * 1000,
            componentType: ComponentType.Button,
          })

          if (orderInteraction) {
            game.localConfig.playerOrder = orderInteraction.customId as TODPlayerOrder
            await orderInteraction.update({
              embeds: [Embed.success(`Player order changed to **${orderInteraction.customId}**`)],
              components: [],
            })
            await interaction.editReply(makeNewMessage(game))
          } else {
            await i.editReply({
              embeds: [Embed.error('Timed out.')],
              components: [],
            })
          }

          break
        }
        // case CreatorOptions.Rounds:
        //   break
        // case CreatorOptions.Autorole:
        //   break
        // case CreatorOptions.Autopin:
        //   break
      }
    } else if (i.isButton()) {
      switch (i.customId) {
        case PlayerOptions.Join:
          if (game.players.length >= game.config.maxPlayers) {
            await i.reply({
              embeds: [Embed.error('Game is full.')],
              ephemeral: true,
            })
            return
          }
          if (game.players.some((p) => p.id === i.user.id)) {
            await i.reply({
              embeds: [Embed.error('You are already in the game.')],
              ephemeral: true,
            })
            return
          }

          game.players.push(i.member as GuildMember)
          i.reply({ embeds: [Embed.success('Joined game.')], ephemeral: true })
          interaction.editReply(makeNewMessage(game))
          break
        case PlayerOptions.Leave:
          if (i.user.id === game.creator.id) {
            await i.reply({
              embeds: [Embed.error('You cannot leave the game you created.')],
              ephemeral: true,
            })
            return
          }
          if (!game.players.some((p) => p.id === i.user.id)) {
            await i.reply({
              embeds: [Embed.error('You are not in the game.')],
              ephemeral: true,
            })
            return
          }
          game.players = game.players.filter((p) => p.id !== i.user.id)
          i.reply({ embeds: [Embed.success('Left game.')], ephemeral: true })
          interaction.editReply(makeNewMessage(game))
          break
      }
    }
  })

  collector.on('end', (c, reason) => {
    if (reason === CreatorOptions.Cancel) {
      message.reply({ embeds: [Embed.info('Game cancelled.')] })
    }

    game.run()
  })

  return CommandResult.Success
}

const checkPermissions = async ({
  interaction,
  guild,
  client,
  channel,
}: CommandContext): Promise<boolean> => {
  const { tod } = client

  assert(guild, 'guild is null')
  assert(channel, 'channel is null')
  assert(channel.type === ChannelType.GuildText)
  const clientMember = guild!.members.cache.get(client.user.id)
  assert(clientMember, 'clientUser is null')

  const permissions = clientMember.permissionsIn(channel)
  if (!permissions?.has('SendMessages')) {
    await interaction.reply({
      embeds: [Embed.error("gamerbot doesn't have permission to send messages in this channel.")],
    })
    return true
  }

  const existing = tod.get(channel.id)
  if (existing) {
    await interaction.reply({
      embeds: [Embed.error('There is already a game in progress in this channel.')],
      ephemeral: true,
    })
    return true
  }

  return false
}

const makeNewMessage = (game: TruthOrDareGame): InteractionReplyOptions & { fetchReply: true } => {
  const embed = new Embed({
    title: 'Truth or Dare Game',
    description: stripIndent`
      ${userMention(game.creator.id)} wants to play Truth or Dare!
      Click below to join.
    `,
  })
    .addField(
      'Players',
      `${game.players.map((player) => userMention(player.id)).join('  ')} (${game.players.length}/${
        game.config.maxPlayers
      })`
    )
    .addField('Game mode', game.config.gameMode)

  return {
    embeds: [embed],
    fetchReply: true,
    components: [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('creator')
          .setPlaceholder('[Creator] Select an option...')
          .addOptions([
            { label: 'Start the game!', value: CreatorOptions.Start },
            { label: 'Cancel the game', value: CreatorOptions.Cancel },
            // { label: 'Change game mode', value: CreatorOptions.Mode },
            { label: 'Change max players', value: CreatorOptions.MaxPlayers },
            // { label: 'Change ask timeout', value: CreatorOptions.AskTimeout },
            // { label: 'Change respond timeout', value: CreatorOptions.RespondTimeout },
            { label: 'Change player order', value: CreatorOptions.PlayerOrder },
            // { label: 'Change # of rounds', value: CreatorOptions.Rounds },
            // { label: 'Change autorole', value: CreatorOptions.Autorole },
            // { label: 'Change autopin', value: CreatorOptions.Autopin },
          ])
      ),

      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(PlayerOptions.Join)
          .setLabel('Join')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(PlayerOptions.Leave)
          .setLabel('Leave')
          .setStyle(ButtonStyle.Danger)
      ),
    ],
  }
}

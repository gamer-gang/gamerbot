/* eslint-disable require-atomic-updates */
import { TODPlayerOrder } from '@prisma/client'
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  GuildMember,
  Message,
  MessageComponentInteraction,
  MessageType,
  PermissionsBitField,
  Role,
  StringSelectMenuBuilder,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
  roleMention,
  userMention,
} from 'discord.js'
import _ from 'lodash'
import { CommandContext } from '../commands/context.js'
import { Embed } from '../util/embed.js'
import { TODConfig, TODGameState, TODType } from './TruthOrDareManager.js'

export class TruthOrDareGame {
  players: GuildMember[] = []

  state = TODGameState.Preparing
  turn = 0
  round = 0
  target?: GuildMember
  turnType?: TODType
  question?: string

  config: TODConfig
  localConfig: Partial<TODConfig>

  role?: Role
  pin?: Message

  constructor(
    private context: CommandContext,
    public channel: TextChannel,
    public creator: GuildMember,
    config: TODConfig
  ) {
    const localConfig: Partial<TODConfig> = {}
    this.localConfig = localConfig

    const configProxy = new Proxy(config, {
      get(target, prop: keyof TODConfig) {
        return localConfig[prop] ?? config[prop]
      },
    })

    this.config = configProxy
  }

  get guild() {
    return this.creator.guild
  }

  async setup() {
    const roleName = `truthordare: ${this.channel.name} ${this.channel.id}`
    const role = await this.guild.roles.create({
      name: roleName,
      color: 'Default',
      mentionable: false,
      hoist: false,
      position: 0,
      permissions: new PermissionsBitField(),
    })

    this.role = role

    await Promise.all(this.players.map((player) => player.roles.add(role)))

    await this.channel.send({
      content: roleMention(role.id),
      embeds: [
        new Embed({
          title: 'Welcome to Truth or Dare!',
          description: `Mention ${roleMention(role.id)} to ping all players. Good luck!`,
        }),
      ],
    })

    await new Promise((resolve) => setTimeout(resolve, 3 * 1000))
  }

  async orderPlayers() {
    if (this.config.playerOrder === TODPlayerOrder.Random) {
      _.shuffle(this.players)
      return
    }

    if (this.config.playerOrder === TODPlayerOrder.Manual) {
      const ordered: (GuildMember | null)[] = Array.from(
        { length: this.players.length },
        () => null
      )

      const orderMsg = await this.channel.send(this.makeOrderMessage(ordered))
      this.setPin(orderMsg)

      const collector = orderMsg.createMessageComponentCollector({
        filter: (interaction) => this.players.some((p) => p.id === interaction.user.id),
        time: 2 * 60 * 1000,
        componentType: ComponentType.Button,
        dispose: true,
      })

      collector.on('collect', (interaction) => {
        const player = this.players.find((p) => p.id === interaction.user.id)!
        const index = parseInt(interaction.customId.split(':')[1])
        ordered[index] = player

        if (ordered.every((p) => p !== null)) {
          collector.stop()
        }

        orderMsg.edit(this.makeOrderMessage(ordered))
      })

      return new Promise<void>((resolve) =>
        collector.on('end', () => {
          const added = new Set(ordered.filter((p) => p !== null).map((p) => p!.id))
          let i = 0
          for (const player of this.players) {
            if (added.has(player.id)) continue
            while (ordered[i] !== null) i++
            ordered[i] = player
          }

          this.players = ordered as GuildMember[]
          resolve()
        })
      )
    }

    const birthdays: { [id: string]: Date } = {}

    const birthdayMessage = await this.channel.send(this.makeBirthdayMessage(birthdays))
    this.setPin(birthdayMessage)

    const collector = birthdayMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (interaction) => this.players.some((p) => p.id === interaction.user.id),
      time: 2 * 60 * 1000,
      dispose: true,
    })

    collector.on('collect', async (interaction) => {
      if (interaction.user.id in birthdays) {
        await interaction.reply({
          embeds: [Embed.error('You already entered your birthday.')],
          ephemeral: true,
        })
        return
      }
      await interaction.showModal({
        title: 'Enter Birthday',
        customId: 'modal',
        components: [
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('birthday')
              .setPlaceholder('MM/DD/YYYY')
              .setMinLength(10)
              .setMaxLength(10)
              .setStyle(TextInputStyle.Short)
              .setLabel('Birthday')
          ),
        ],
      })

      const response = await interaction.awaitModalSubmit({
        time: 2 * 60 * 1000,
        filter: (i) => i.user.id === interaction.user.id,
        dispose: true,
      })

      if (!response) return

      const birthday = response.fields.getTextInputValue('birthday')
      const regex = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/
      if (!regex.test(birthday)) {
        await response.reply({
          content: 'Invalid birthday. It must be in the format MM/DD/YYYY. Please try again.',
          ephemeral: true,
        })
        return
      }

      const [month, day, year] = regex
        .exec(birthday)!
        .slice(1)
        .map((n) => parseInt(n))
      if (month < 1 || month > 12 || day < 1 || day > 31 || year > new Date().getFullYear()) {
        await response.reply({
          content: 'Invalid birthday. The date is invalid. Please try again.',
          ephemeral: true,
        })
        return
      }

      birthdays[interaction.user.id] = new Date(year, month - 1, day)
      await response.reply({
        content: 'Your birthday has been set!',
        ephemeral: true,
      })
      birthdayMessage.edit(this.makeBirthdayMessage(birthdays))

      if (Object.keys(birthdays).length === this.players.length) {
        collector.stop()
      }
    })

    return new Promise<void>((resolve) =>
      collector.on('end', () => {
        const ordered = Object.entries(birthdays)
          .sort((a, b) => a[1].getTime() - b[1].getTime())
          .map(([id]) => this.players.find((p) => p.id === id)!)
        const added = new Set(ordered.map((p) => p.id))
        this.players = [...ordered, ...this.players.filter((p) => !added.has(p.id))]
        resolve()
      })
    )
  }

  async teardown() {
    if (this.role) {
      await this.role.delete()
    }
  }

  async run() {
    try {
      await this.setup()
      await this.orderPlayers()

      let lastInteraction: MessageComponentInteraction | undefined

      for (this.round = 0; this.round < this.config.rounds; this.round++) {
        for (this.turn = 0; this.turn < this.players.length; this.turn++) {
          this.target = undefined
          this.turnType = undefined
          this.question = undefined

          this.state = TODGameState.ChoosingTarget
          const asker = this.players[this.turn]
          let askMessage: Message

          if (lastInteraction) {
            askMessage = await lastInteraction.reply({
              ...this.makeAskMessage(asker),
              fetchReply: true,
            })
            lastInteraction = undefined
          } else {
            askMessage = await this.channel.send(this.makeAskMessage(asker))
          }
          this.setPin(askMessage)

          while (!this.target || !this.turnType) {
            const response = await askMessage.awaitMessageComponent({
              dispose: true,
              filter: (interaction) => interaction.user.id === asker.id,
              time: this.config.askTimeout * 1000,
            })

            if (!response) {
              await askMessage.edit({
                content: `${userMention(asker.id)} too long to choose a target!`,
                allowedMentions: { users: [asker.id] },
                embeds: [],
                components: [],
              })
              await new Promise((resolve) => setTimeout(resolve, 4000))
              continue
            }

            if (response.componentType === ComponentType.StringSelect) {
              const targetId = response.values[0]
              this.target = this.players.find((p) => p.id === targetId)!
            } else if (response.componentType === ComponentType.Button) {
              this.turnType = response.customId as TODType
            }

            await response.update(this.makeAskMessage(asker))
          }

          this.state = TODGameState.Asking

          const questionResponse = await askMessage.awaitMessageComponent({
            dispose: true,
            filter: (interaction) => interaction.user.id === asker.id,
            time: this.config.askTimeout * 1000,
            componentType: ComponentType.Button,
          })

          if (questionResponse.customId === 'random') {
            // TODO
            this.question = `random ${this.turnType.toLowerCase()} here`
          } else {
            questionResponse.showModal({
              title: `Ask ${this.target!.user.tag} a ${this.turnType.toLowerCase()}`,
              customId: 'ask',
              components: [
                new ActionRowBuilder<TextInputBuilder>().addComponents(
                  new TextInputBuilder()
                    .setCustomId('question')
                    .setPlaceholder('Ask a question...')
                    .setMinLength(1)
                    .setMaxLength(400)
                    .setStyle(TextInputStyle.Paragraph)
                    .setLabel('Question')
                ),
              ],
            })

            const response = await questionResponse.awaitModalSubmit({
              filter: (interaction) => interaction.user.id === asker.id,
              time: this.config.askTimeout * 1000,
            })

            if (!response) {
              await askMessage.edit({
                content: `${userMention(
                  asker.id
                )} too long to write a ${this.turnType.toLowerCase()}!`,
                allowedMentions: { users: [asker.id] },
                embeds: [],
                components: [],
              })
              await new Promise((resolve) => setTimeout(resolve, 4000))
              continue
            }

            this.question = response.fields.getTextInputValue('question')!

            await response.reply({ embeds: [Embed.success('Question sent!')], ephemeral: true })
          }

          this.state = TODGameState.Responding

          const responseMessage = await this.channel.send({
            content: `${userMention(this.target!.id)}`,
            allowedMentions: { users: [this.target!.id] },
            embeds: [
              new Embed({
                title: `${this.target!.user.tag}: ${this.turnType}`,
                description: this.question,
              }),
            ],
            components: [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setCustomId('done')
                  .setLabel('Done')
                  .setStyle(ButtonStyle.Success)
              ),
            ],
          })
          this.setPin(responseMessage)

          const component = await responseMessage.awaitMessageComponent({
            dispose: true,
            filter: (interaction) => interaction.user.id === this.target!.id,
            time: this.config.respondTimeout * 1000,
            componentType: ComponentType.Button,
          })

          lastInteraction = component
        }
      }

      await this.channel.send({ embeds: [Embed.info('Game over! Great game!')] })
    } catch (error) {
      this.channel.send(`An error occurred: ${error}`)
    } finally {
      await this.teardown()
      if (this.pin) {
        await this.pin.unpin()
      }
    }
  }

  private makeAskMessage(asker: GuildMember) {
    const embed = new Embed({
      title: 'Truth or Dare',
      description: `Select a player to target, and a type of question to ask.`,
    })

    if (this.target) {
      embed.addField('✅ Target', userMention(this.target.id), true)
    } else {
      embed.addField('❌ Target', 'Select a target!', true)
    }

    if (this.turnType) {
      embed.addField('✅ Type', this.turnType, true)
    } else {
      embed.addField('❌ Type', 'Select a type!', true)
    }

    const components = []

    if (!this.target) {
      components.push(
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('target')
            .setPlaceholder('Select a player...')
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(
              this.players
                .filter((p) => p.id !== asker.id)
                .map((player) => ({
                  label: player.displayName,
                  description: player.user.tag,
                  value: player.id,
                }))
            )
        )
      )
    }

    if (!this.turnType) {
      components.push(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('truth').setLabel('Truth').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('dare').setLabel('Dare').setStyle(ButtonStyle.Primary)
        )
      )
    }

    if (this.target && this.turnType && !this.question) {
      components.push(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('random')
            .setLabel(`Ask random`)
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('custom')
            .setLabel(`Write custom`)
            .setStyle(ButtonStyle.Primary)
        )
      )
    }

    return {
      content: `${userMention(asker.id)}: it's your turn!`,
      allowedMentions: { users: [asker.id] },
      embeds: [embed],
      components,
    }
  }

  async setPin(message: Message) {
    if (this.pin) {
      await this.pin.unpin()
    }

    this.pin = message
    await this.pin.pin()
    // delete the system message
    const messages = [...(await this.channel.messages.fetch({ limit: 5 })).values()]
    const systemMessage = messages.find((m) => m.type === MessageType.ChannelPinnedMessage)
    if (systemMessage) {
      await systemMessage.delete()
    }
  }

  private makeOrderMessage(ordered: (GuildMember | null)[]) {
    const components = []
    for (let i = 0; i < Math.ceil(this.players.length / 5); i++) {
      const row = []
      for (let col = 0; col < Math.min(5, this.players.length - i * 5); col++) {
        row.push(
          new ButtonBuilder()
            .setStyle(ButtonStyle.Primary)
            .setCustomId(`order:${i * 5 + col}`)
            .setLabel(`#${i * 5 + col + 1}`)
            .setDisabled(ordered[i * 5 + col] !== null)
        )
      }

      components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(row))
    }

    return {
      embeds: [
        new Embed({
          title: 'Order Players',
          description: `Click on a button to put yourself in order.\n\n${ordered
            .map((p, i) => `${i + 1}. ${p ? userMention(p.id) : ''}`)
            .join('\n')}`,
          footer: { text: 'Time limit: 2 minutes' },
        }),
      ],
      components,
    }
  }

  private makeBirthdayMessage(birthdays: { [id: string]: Date }) {
    return {
      embeds: [
        new Embed({
          title: 'Order Players',
          description: `Click below to enter your birthday. ${
            this.config.playerOrder === TODPlayerOrder.OldestFirst
              ? 'The oldest players will go first.'
              : 'The youngest players will go first.'
          }`,
          footer: {
            text: 'Time limit: 2 minutes · Privacy disclaimer: your birthday is only used to calculate the player order and is not saved or logged anywhere.',
          },
        }).addField('Responses', `${Object.keys(birthdays).length}/${this.players.length}`, true),
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setStyle(ButtonStyle.Primary)
            .setCustomId('birthday')
            .setLabel('Enter Birthday')
        ),
      ],
    }
  }
}

import {
  ActivityType,
  ApplicationCommandType,
  Client,
  ClientOptions,
  ClientUser,
  Formatters,
  GatewayIntentBits,
  Guild,
  Interaction,
  InteractionType,
  Message,
  UserContextMenuCommandInteraction,
} from 'discord.js'
import log4js from 'log4js'
import assert from 'node:assert'
import { DEFAULT_COMMANDS } from '../commands.js'
import { Command, CommandResult } from '../commands/command.js'
import { CommandContext, MessageCommandContext, UserCommandContext } from '../commands/context.js'
import { sendUrban } from '../commands/messages/urban.js'
import { IS_DEVELOPMENT } from '../constants.js'
import { initLogger } from '../logger.js'
import { prisma } from '../prisma.js'
import { KnownInteractions } from '../types.js'
import { applicationCommandTypeName, hasPermissions } from '../util.js'
import { interactionReplySafe } from '../util/discord.js'
import { Embed } from '../util/embed.js'
import { formatErrorMessage, formatOptions } from '../util/format.js'
import { AnalyticsManager } from './AnalyticsManager.js'
import { ClientStorage } from './ClientStorage.js'
import { CountManager } from './CountManager.js'
import { MarkovManager } from './MarkovManager.js'
import { PresenceManager } from './PresenceManager.js'
import { TriviaManager } from './TriviaManager.js'
import { TruthOrDareManager } from './TruthOrDareManager.js'
import { AnalyticsEvent } from './_analytics/event.js'
import * as eggs from './egg.js'

export interface GamerbotClientOptions extends Exclude<ClientOptions, 'intents'> {}

export class GamerbotClient extends Client {
  declare readonly user: ClientUser
  readonly #logger = log4js.getLogger('client')
  readonly #discordLogger = log4js.getLogger('discord')
  readonly #commandLogger = log4js.getLogger('command')

  readonly commands = new Map<string, Command>()
  readonly presenceManager = new PresenceManager(this)
  readonly analytics = new AnalyticsManager(this)
  readonly countManager = new CountManager(this)
  readonly triviaManager = new TriviaManager(this)
  readonly markov = new MarkovManager(this)
  readonly tod = new TruthOrDareManager()

  readonly storage = new ClientStorage()

  #updateAnalyticsInterval: NodeJS.Timeout | null = null
  #updateCountsInterval: NodeJS.Timeout | null = null
  /** set of guild ids that are already known to have config rows in the db to save queries */
  #hasConfig = new Set<string>()

  async #updateAnalytics(): Promise<void> {
    await this.analytics.flushAll()
    await this.analytics.update()
  }

  constructor(options?: GamerbotClientOptions) {
    super({
      ...options,
      intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.MessageContent,
      ],
    })

    initLogger()

    for (const command of DEFAULT_COMMANDS) {
      this.commands.set(command.name, command)
    }

    this.on('error', (err) => this.#discordLogger.error(err))
    this.on('warn', (warn) => this.#discordLogger.warn(warn))

    this.on('ready', async () => {
      await this.analytics.initialize()
      this.analytics.trackEvent(AnalyticsEvent.BotLogin)

      await this.countManager.update()

      // this.markov.load().then(() => void this.markov.sync())
    })

    this.on('debug', this.onDebug.bind(this))
    this.on('messageCreate', this.onMessageCreate.bind(this))
    this.on('guildCreate', this.onGuildCreate.bind(this))
    this.on('guildDelete', this.onGuildDelete.bind(this))
    this.on('interactionCreate', this.onInteractionCreate.bind(this))

    this.#updateAnalyticsInterval = setInterval(() => void this.#updateAnalytics(), 5 * 60_000)
    this.#updateCountsInterval = setInterval(() => void this.countManager.update(), 5 * 60_000)

    // setInterval(() => void this.marskov.save(), 60 * 60_000)
  }

  getLogger(category: string): log4js.Logger {
    return log4js.getLogger(category)
  }

  async refreshPresence(): Promise<void> {
    const num = await eggs.getTotal()
    this.presenceManager.presence = {
      activities: [
        {
          type: ActivityType.Playing,
          name: `with ${num.toLocaleString()} egg${num === 1n ? '' : 's'} | /help`,
        },
      ],
    }
  }

  async ensureConfig(guildId: string): Promise<void> {
    if (this.#hasConfig.has(guildId)) return

    if (!/\d{18}/.test(guildId)) {
      throw new Error(`Invalid guild id: ${guildId}`)
    }

    await prisma.config.upsert({
      create: { guildId },
      update: {},
      where: { guildId },
    })

    await this.tod.ensureConfig(guildId)

    this.#hasConfig.add(guildId)
  }

  countUsers = this.countManager.countUsers.bind(this.countManager)
  countGuilds = this.countManager.countGuilds.bind(this.countManager)

  onDebug(content: string): void {
    if (content.includes('Heartbeat')) return

    if (content.includes('Remaining: ')) {
      this.#logger.info(`Remaining gateway sessions: ${content.split(' ').reverse()[0]}`)
    }

    if (content.includes('Manager was destroyed. Called by:')) return

    this.#discordLogger.trace(content)
  }

  async onMessageCreate(message: Message): Promise<void> {
    if (message.author.id === this.user.id) return
    void eggs.onMessage(this, message)
    if (!message.author.bot) {
      void this.markov.addMessage(message.cleanContent || message.content)
    }
  }

  async onGuildCreate(guild: Guild): Promise<void> {
    await this.ensureConfig(guild.id)
  }

  async onGuildDelete(guild: Guild): Promise<void> {
    await prisma.config.delete({ where: { guildId: guild.id } })

    this.#hasConfig.delete(guild.id)
  }

  async onInteractionCreate(interaction: Interaction): Promise<void> {
    if (interaction.guild != null) {
      await this.ensureConfig(interaction.guild.id)
    }

    let command: Command | undefined

    try {
      if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
        command = this.commands.get(interaction.commandName)

        if (command == null) {
          await interaction.respond([{ name: 'Command not found.', value: 'command-not-found' }])
          return
        }

        assert(command.type === ApplicationCommandType.ChatInput, 'Command type must be ChatInput')

        const results = await command.autocomplete(interaction, this)

        if (results.length === 0) {
          await interaction.respond([{ name: 'No results found.', value: 'no-results-found' }])
          return
        }

        await interaction.respond(results)
        return
      }

      if (interaction.type === InteractionType.ApplicationCommand) {
        command = this.commands.get(interaction.commandName)

        if (command == null) {
          await interaction.reply({ embeds: [Embed.error('Command not found.')] })
          return
        }

        if (command.type !== ApplicationCommandType.ChatInput) {
          const context =
            interaction.commandType === ApplicationCommandType.Message
              ? new MessageCommandContext(this, interaction, prisma)
              : new UserCommandContext(
                  this,
                  interaction as UserContextMenuCommandInteraction,
                  prisma
                )

          assert(command.type === interaction.commandType)

          let result: CommandResult
          if (hasPermissions(interaction, command)) {
            result = await command.run(
              // @ts-expect-error
              context
            )
          } else {
            result = CommandResult.Success
          }

          this.analytics.trackCommandResult(result, command)
        } else {
          assert(command.type === interaction.commandType)

          const context = new CommandContext(this, interaction, prisma)

          if (IS_DEVELOPMENT) {
            this.#commandLogger.debug(
              `/${interaction.commandName} ${formatOptions(interaction.options.data)}`
            )
          }

          this.analytics.trackEvent(
            AnalyticsEvent.CommandSent,
            command.name,
            applicationCommandTypeName[command.type],
            interaction.user.id
          )

          let result: CommandResult
          if (hasPermissions(interaction, command)) {
            result = await command.run(
              // @ts-expect-error
              context
            )
          } else {
            result = CommandResult.Success
          }

          this.analytics.trackCommandResult(result, command)
        }
      }

      if (interaction.isButton()) {
        if (!interaction.customId.includes('_')) return

        const [action, id] = interaction.customId.split('_')

        // TODO: refactor and move to a separate file
        if (action === 'role-toggle') {
          if (interaction.guild == null) return
          if (interaction.member == null) return

          const member = interaction.guild.members.resolve(interaction.member.user.id)
          if (!member) return

          const role = interaction.guild.roles.resolve(id)
          if (!role) return

          await interaction.deferReply({ ephemeral: true })
          if (member.roles.cache.has(role.id)) {
            await member.roles.remove(role.id)
            await interaction.editReply({
              embeds: [Embed.success(`Success! Removed role ${Formatters.roleMention(role.id)}.`)],
            })
          } else {
            await member.roles.add(role.id)
            await interaction.editReply({
              embeds: [Embed.success(`Success! Got role ${Formatters.roleMention(role.id)}.`)],
            })
          }
        }

        return
      }

      if (interaction.isStringSelectMenu()) {
        const id = interaction.customId
        if (id === KnownInteractions.UrbanDefine) {
          const term = interaction.values[0]
          sendUrban(interaction, term)
        }
        return
      }
    } catch (err) {
      this.#logger.error(err)

      await interactionReplySafe(interaction, { embeds: [Embed.error(formatErrorMessage(err))] })
      if (command != null) {
        this.analytics.trackCommandResult(CommandResult.Failure, command)
      }
    }
  }
}

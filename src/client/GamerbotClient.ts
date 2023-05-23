/* eslint-disable @typescript-eslint/no-explicit-any */
import * as Sentry from '@sentry/node'
import { ProfilingIntegration } from '@sentry/profiling-node'
import {
  ActivityType,
  ChannelType,
  Client,
  ClientOptions,
  ClientUser,
  Guild,
  Interaction,
  InteractionType,
  Message,
} from 'discord.js'
import log4js from 'log4js'
import { DEFAULT_COMMANDS } from '../commands.js'
import { Command } from '../commands/command.js'
import env, { CLIENT_INTENTS, IS_DEVELOPMENT } from '../env.js'
import { initLogger } from '../logger.js'
import { prisma } from '../prisma.js'
import { interactionReplySafe } from '../util/discord.js'
import { Embed } from '../util/embed.js'
import { ClientContext } from './ClientContext.js'
import { ClientStorage } from './ClientStorage.js'
import { CountManager } from './CountManager.js'
import { CustomEmojiManager } from './CustomEmojiManager.js'
import { FlagsManager } from './FlagsManager.js'
import { MarkovManager } from './MarkovManager.js'
import { PresenceManager } from './PresenceManager.js'
import { TriviaManager } from './TriviaManager.js'
import * as eggs from './egg.js'
import * as eval from './eval.js'
import handleApplicationCommand from './handleApplicationCommand.js'
import handleAutocomplete from './handleAutocomplete.js'
import handleMessageComponent from './handleMessageComponent.js'

export interface GamerbotClientOptions extends Exclude<ClientOptions, 'intents'> {}

export class GamerbotClient extends Client {
  declare readonly user: ClientUser
  readonly #logger = log4js.getLogger('client')
  readonly #discordLogger = log4js.getLogger('discord')

  readonly commands = new Map<string, Command>()
  readonly presenceManager = new PresenceManager(this)
  readonly countManager = new CountManager(this)
  readonly triviaManager = new TriviaManager(this)
  readonly markov = new MarkovManager(this)
  readonly flags = new FlagsManager()
  readonly customEmojis = new CustomEmojiManager(this)

  readonly storage = new ClientStorage()

  #updateCountsInterval: NodeJS.Timeout | null = null
  /** set of guild ids that are already known to have config rows in the db to save queries */
  #hasConfig = new Set<string>()

  constructor(options?: GamerbotClientOptions) {
    super({ ...options, intents: CLIENT_INTENTS })

    Sentry.init({
      dsn: env.SENTRY_DSN,
      tracesSampleRate: 1.0,
      profilesSampleRate: 1.0,
      environment: IS_DEVELOPMENT ? 'development' : 'production',
      enabled: !IS_DEVELOPMENT,
      integrations: [new ProfilingIntegration()],
      release: globalThis.SENTRY_RELEASE,
    })

    initLogger()

    for (const command of DEFAULT_COMMANDS) {
      this.commands.set(command.name, command)
    }

    this.on('error', (err) => this.#discordLogger.error(err))
    this.on('warn', (warn) => this.#discordLogger.warn(warn))

    this.on('ready', async () => {
      await Promise.all([
        this.countManager.update(),
        this.customEmojis.populateEmojis(),
        this.markov.load().then(() => this.markov.sync()),
      ])
    })

    this.on('debug', this.onDebug.bind(this))
    this.on('messageCreate', this.onMessageCreate.bind(this))
    this.on('guildCreate', this.onGuildCreate.bind(this))
    this.on('guildDelete', this.onGuildDelete.bind(this))
    this.on('interactionCreate', this.onInteractionCreate.bind(this))

    this.#updateCountsInterval = setInterval(() => void this.countManager.update(), 5 * 60_000)

    setInterval(() => void this.markov.save(), 60 * 60_000)
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
    void eval.onMessage(this, message)
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

    const ctx = new ClientContext()

    try {
      switch (interaction.type) {
        case InteractionType.ApplicationCommandAutocomplete:
          await handleAutocomplete.call(this, ctx, interaction)
          break
        case InteractionType.ApplicationCommand:
          await handleApplicationCommand.call(this, ctx, interaction)
          break
        case InteractionType.MessageComponent:
          await handleMessageComponent.call(this, ctx, interaction)
          break
      }
    } catch (err) {
      Sentry.captureException(err)
      ctx.transaction?.setStatus('internal_error')
      this.#logger.error(err)
      await interactionReplySafe(interaction, { embeds: [Embed.error(err)] })
    } finally {
      ctx.transaction?.finish()
      Sentry.setUser(null)
      Sentry.configureScope((scope) => scope.clear())
    }
  }

  startSentry(interaction: Interaction) {
    Sentry.setUser({
      id: interaction.user.id,
      username: interaction.user.tag,
    })
    if ('options' in interaction) {
      Sentry.setContext(
        'options',
        Object.fromEntries(interaction.options.data.map((o) => [o.name, o]))
      )
    }
    Sentry.setContext('channel', {
      id: interaction.channelId,
      type: interaction.channel ? ChannelType[interaction.channel.type] : '<unknown>',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      name: (interaction.channel as any)?.name,
    })
    Sentry.setContext(
      'guild',
      interaction.guild
        ? {
            id: interaction.guild.id,
            name: interaction.guild.name,
            size: interaction.guild.memberCount,
          }
        : null
    )
  }
}

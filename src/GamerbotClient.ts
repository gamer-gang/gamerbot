import {
  Client,
  ClientOptions,
  ClientUser,
  Formatters,
  Guild,
  Interaction,
  Message,
} from 'discord.js'
import log4js from 'log4js'
import assert from 'node:assert'
import { AnalyticsEvent } from './analytics/event.js'
import { AnalyticsManager } from './analytics/manager.js'
import { DEFAULT_COMMANDS } from './commands.js'
import { Command, CommandResult } from './commands/command.js'
import { CommandContext, MessageCommandContext, UserCommandContext } from './commands/context.js'
import { IS_DEVELOPMENT } from './constants.js'
import { CountManager } from './CountManager.js'
import * as eggs from './egg.js'
import { initLogger } from './logger.js'
import { prisma } from './prisma.js'
import { hasPermissions } from './util.js'
import { interactionReplySafe } from './util/discord.js'
import { Embed } from './util/embed.js'
import { formatErrorMessage, formatOptions } from './util/format.js'
import { PresenceManager } from './util/presence.js'

export interface GamerbotClientOptions extends Exclude<ClientOptions, 'intents'> {}

export class GamerbotClient extends Client {
  readonly user!: ClientUser
  readonly #logger = log4js.getLogger('client')
  readonly #discordLogger = log4js.getLogger('discord')
  readonly #commandLogger = log4js.getLogger('command')

  readonly commands = new Map<string, Command>()
  readonly presenceManager = new PresenceManager(this)
  readonly analytics = new AnalyticsManager(this)
  readonly countManager = new CountManager(this)

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
        'DIRECT_MESSAGES',
        'GUILDS',
        'GUILD_MEMBERS',
        'GUILD_BANS',
        'GUILD_EMOJIS_AND_STICKERS',
        'GUILD_INVITES',
        'GUILD_MESSAGES',
        'GUILD_MESSAGE_REACTIONS',
      ],
    })

    initLogger()

    DEFAULT_COMMANDS.forEach((command) => {
      this.commands.set(command.name, command)
    })

    this.on('error', (err) => this.#discordLogger.error(err))
    this.on('warn', (warn) => this.#discordLogger.warn(warn))

    this.on('ready', async () => {
      await this.analytics.initialize()
      this.analytics.trackEvent(AnalyticsEvent.BotLogin)

      await this.countManager.update()
    })

    this.on('debug', this.onDebug.bind(this))
    this.on('messageCreate', this.onMessageCreate.bind(this))
    this.on('guildCreate', this.onGuildCreate.bind(this))
    this.on('guildDelete', this.onGuildDelete.bind(this))
    this.on('interactionCreate', this.onInteractionCreate.bind(this))

    this.#updateAnalyticsInterval = setInterval(() => void this.#updateAnalytics(), 5 * 60_000)
    this.#updateCountsInterval = setInterval(() => void this.countManager.update(), 5 * 60_000)
  }

  getLogger(category: string): log4js.Logger {
    return log4js.getLogger(category)
  }

  async refreshPresence(): Promise<void> {
    const num = await eggs.getTotal()
    this.presenceManager.presence = {
      activities: [
        {
          type: 'PLAYING',
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
      if (interaction.isAutocomplete()) {
        command = this.commands.get(interaction.commandName)

        if (command == null) {
          await interaction.respond([{ name: 'Command not found.', value: 'command-not-found' }])
          return
        }

        assert(command.type === 'CHAT_INPUT', 'Command type must be CHAT_INPUT')

        const results = await command.autocomplete(interaction)

        if (results.length === 0) {
          await interaction.respond([{ name: 'No results found.', value: 'no-results-found' }])
          return
        }

        await interaction.respond(results)
        return
      }

      if (interaction.isContextMenu()) {
        command = this.commands.get(interaction.commandName)

        if (command == null) {
          await interaction.reply({ embeds: [Embed.error('Command not found.')] })
          return
        }

        assert(
          command.type === 'USER' || command.type === 'MESSAGE',
          'Command type must be USER or MESSAGE'
        )

        const context =
          interaction.targetType === 'MESSAGE'
            ? new MessageCommandContext(this, interaction, prisma)
            : new UserCommandContext(this, interaction, prisma)

        let result: CommandResult
        if (hasPermissions(interaction, command)) {
          result = await command.run(
            // @ts-expect-error guild types are not correct
            context
          )
        } else {
          result = CommandResult.Success
        }

        this.analytics.trackCommandResult(result, command)
      }

      if (interaction.isButton()) {
        if (!interaction.customId.includes('_')) return

        const [action, id] = interaction.customId.split('_')

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

      if (!interaction.isCommand()) return
      command = this.commands.get(interaction.commandName)

      if (command == null) {
        await interaction.reply({ embeds: [Embed.error('Command not found.')] })
        return
      }

      assert(command.type === 'CHAT_INPUT', 'Command type must be CHAT_INPUT')

      const context = new CommandContext(this, interaction, prisma)

      if (IS_DEVELOPMENT) {
        this.#commandLogger.debug(
          `/${interaction.commandName} ${formatOptions(interaction.options.data)}`
        )
      }

      this.analytics.trackEvent(
        AnalyticsEvent.CommandSent,
        command.name,
        command.type,
        interaction.user.id
      )

      let result: CommandResult
      if (hasPermissions(interaction, command)) {
        result = await command.run(
          // @ts-expect-error guild types are not correct
          context
        )
      } else {
        result = CommandResult.Success
      }

      this.analytics.trackCommandResult(result, command)
    } catch (err) {
      this.#logger.error(err)

      await interactionReplySafe(interaction, { embeds: [Embed.error(formatErrorMessage(err))] })
      if (command != null) {
        this.analytics.trackCommandResult(CommandResult.Failure, command)
      }
    }
  }
}

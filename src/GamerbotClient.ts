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
import { Command, CommandResult } from './commands/command.js'
import COMMAND_CONFIG from './commands/config/config.js'
import { CommandContext, MessageCommandContext, UserCommandContext } from './commands/context.js'
import COMMAND_RPS from './commands/games/rps.js'
import COMMAND_ABOUT from './commands/general/about.js'
import COMMAND_ANALYTICS from './commands/general/analytics.js'
import COMMAND_AVATAR from './commands/general/avatar.js'
import COMMAND_GETAVATAR from './commands/general/getavatar.js'
import COMMAND_SERVERICON from './commands/general/servericon.js'
import COMMAND_SERVERINFO from './commands/general/serverinfo.js'
import COMMAND_COWSAY from './commands/messages/cowsay.js'
import COMMAND_EGGLEADERBOARD from './commands/messages/eggleaderboard.js'
import COMMAND_LMGTFY from './commands/messages/lmgtfy.js'
import COMMAND_XKCD from './commands/messages/xkcd.js'
import COMMAND_STATS from './commands/minecraft/stats.js'
import COMMAND_USERNAME from './commands/minecraft/username.js'
import COMMAND_BAN from './commands/moderation/ban.js'
import COMMAND_KICK from './commands/moderation/kick.js'
import COMMAND_PURGE from './commands/moderation/purge.js'
import COMMAND_PURGETOHERE from './commands/moderation/purgetohere.js'
import COMMAND_ROLE from './commands/moderation/role.js'
import COMMAND_UNBAN from './commands/moderation/unban.js'
import COMMAND_APIMESSAGE from './commands/utility/apimessage.js'
import COMMAND_CHARACTER from './commands/utility/character.js'
import COMMAND_COLOR from './commands/utility/color.js'
import COMMAND_LATEX from './commands/utility/latex.js'
import COMMAND_MATH from './commands/utility/math.js'
import COMMAND_PING from './commands/utility/ping.js'
import COMMAND_RUN from './commands/utility/run.js'
import COMMAND_TIME from './commands/utility/time.js'
import COMMAND_TIMESTAMP from './commands/utility/timestamp.js'
import { IS_DEVELOPMENT } from './constants.js'
import * as eggs from './egg.js'
import { initLogger } from './logger.js'
import { Plugin } from './Plugin.js'
import { prisma } from './prisma.js'
import { formatOptions, hasPermissions } from './util.js'
import { interactionReplySafe } from './util/discord.js'
import { Embed } from './util/embed.js'
import { formatErrorMessage } from './util/message.js'
import { PresenceManager } from './util/presence.js'

const DEFAULT_COMMANDS = [
  // config
  COMMAND_CONFIG,
  // games
  COMMAND_RPS,
  // general
  COMMAND_ABOUT,
  COMMAND_ANALYTICS,
  COMMAND_AVATAR,
  COMMAND_GETAVATAR,
  COMMAND_SERVERICON,
  COMMAND_SERVERINFO,
  // messages
  COMMAND_COWSAY,
  COMMAND_EGGLEADERBOARD,
  COMMAND_LMGTFY,
  COMMAND_XKCD,
  // minecraft
  COMMAND_STATS,
  COMMAND_USERNAME,
  // moderation
  COMMAND_BAN,
  COMMAND_KICK,
  COMMAND_PURGE,
  COMMAND_PURGETOHERE,
  COMMAND_ROLE,
  COMMAND_UNBAN,
  // utility
  COMMAND_APIMESSAGE,
  COMMAND_CHARACTER,
  COMMAND_COLOR,
  COMMAND_LATEX,
  COMMAND_MATH,
  COMMAND_PING,
  COMMAND_RUN,
  COMMAND_TIME,
  COMMAND_TIMESTAMP,
]

export interface GamerbotClientOptions extends Exclude<ClientOptions, 'intents'> {
  plugins?: Plugin[]
}

export class GamerbotClient extends Client {
  readonly user!: ClientUser
  readonly #logger = log4js.getLogger('client')
  readonly #discordLogger = log4js.getLogger('discord')
  readonly #commandLogger = log4js.getLogger('command')

  getLogger(category: string): log4js.Logger {
    return log4js.getLogger(category)
  }

  readonly commands: Map<string, Command> = new Map()
  readonly presenceManager: PresenceManager = new PresenceManager(this)
  readonly analytics: AnalyticsManager = new AnalyticsManager(this)

  static readonly DEFAULT_COMMANDS = DEFAULT_COMMANDS

  #updateAnalyticsInterval: NodeJS.Timeout | null = null
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

    GamerbotClient.DEFAULT_COMMANDS.forEach((command) => {
      this.commands.set(command.name, command)
    })

    this.on('debug', this.onDebug.bind(this))
    this.on('messageCreate', this.onMessage.bind(this))
    this.on('interactionCreate', this.onInteraction.bind(this))
    this.on('guildCreate', this.onGuildCreate.bind(this))
    this.on('guildDelete', this.onGuildDelete.bind(this))
    // this.on('apiRequest', (req) => {
    //   this.#apiLogger.trace(`REQUEST ${req.method} ${req.path}`)
    // })
    // this.on('apiResponse', (res) => {
    //   this.#apiLogger.trace(`RESPONSE ${res.method} ${res.path}`)
    // })
    this.on('error', (err) => {
      this.#discordLogger.error(err)
    })
    this.on('warn', (warn) => {
      this.#discordLogger.warn(warn)
    })

    this.on('ready', async () => {
      await this.analytics.initialize()
      this.analytics.trackEvent(AnalyticsEvent.BotLogin)
    })

    this.#updateAnalyticsInterval = setInterval(() => void this.#updateAnalytics(), 1000 * 60 * 5) // 5 minutes
  }

  registerPlugins(...plugins: Plugin[]): void {
    plugins.forEach((plugin) => {
      plugin.commands.forEach((command) => {
        const name = command.name.toLowerCase()
        if (this.commands.has(name)) {
          throw new Error(`Command ${name} already exists`)
        }

        this.commands.set(name, command)
      })
    })
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

  async countGuilds(): Promise<number> {
    const shard = this.shard

    if (shard == null) {
      return this.guilds.cache.size
    }

    const guilds = await shard.fetchClientValues('guilds.cache.size')

    assert(
      Array.isArray(guilds) && guilds.every((guild) => typeof guild === 'number'),
      'guilds is not an array of numbers'
    )

    return (guilds as number[]).reduce((a, b) => a + b, 0)
  }

  async #countUsers(client: Client): Promise<string[]> {
    const guilds = await Promise.all(client.guilds.cache.map((guild) => guild.members.fetch()))
    const users = guilds.reduce<string[]>((acc, guildMembers) => {
      return [...acc, ...guildMembers.mapValues((member) => member.user.id).values()]
    }, [])
    return users.flat(1)
  }

  async countUsers(): Promise<number> {
    const shard = this.shard

    if (shard == null) {
      const users = await this.#countUsers(this)
      return new Set(users).size
    }

    const users = await shard.broadcastEval((client) => this.#countUsers(client))
    return new Set(users.flat(1)).size
  }

  onDebug(content: string): void {
    if (content.includes('Heartbeat')) return

    if (content.includes('Remaining: ')) {
      this.#logger.info(`Remaining gateway sessions: ${content.split(' ').reverse()[0]}`)
    }

    if (content.includes('Manager was destroyed. Called by:')) return

    this.#discordLogger.trace(content)
  }

  async onMessage(message: Message): Promise<void> {
    if (message.author.id === this.user.id) return
    void eggs.onMessage(this, message)
  }

  /** set of guild ids that are already known to have config rows in the db to save queries */
  #hasConfig = new Set<string>()

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

  async onGuildCreate(guild: Guild): Promise<void> {
    await this.ensureConfig(guild.id)
  }

  async onGuildDelete(guild: Guild): Promise<void> {
    await prisma.config.delete({ where: { guildId: guild.id } })

    this.#hasConfig.delete(guild.id)
  }

  async onInteraction(interaction: Interaction): Promise<void> {
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

        this.#trackResult(result, command)
      }

      if (interaction.isButton()) {
        if (!interaction.customId.includes('_')) return

        const [action, id] = interaction.customId.split('_')
        if (action === 'role-add') {
          if (interaction.guild == null) return
          if (interaction.member == null) return

          const member = interaction.guild.members.resolve(interaction.member.user.id)
          if (!member) return

          const role = interaction.guild.roles.resolve(id)
          if (!role) return

          await interaction.deferReply({ ephemeral: true })
          await member.roles.add(id)
          await interaction.editReply({
            embeds: [Embed.success(`Success! Got role ${Formatters.roleMention(role.id)}.`)],
          })
        }
        if (action === 'role-remove') {
          if (interaction.guild == null) return
          if (interaction.member == null) return

          const member = interaction.guild.members.resolve(interaction.member.user.id)
          if (!member) return

          const role = interaction.guild.roles.resolve(id)
          if (!role) return

          await interaction.deferReply({ ephemeral: true })
          await member.roles.remove(id)
          await interaction.editReply({
            embeds: [Embed.success(`Success! Removed role ${Formatters.roleMention(role.id)}.`)],
          })
        }
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

      this.#trackResult(result, command)
    } catch (err) {
      this.#logger.error(err)

      await interactionReplySafe(interaction, { embeds: [Embed.error(formatErrorMessage(err))] })
      if (command != null) {
        this.#trackResult(CommandResult.Failure, command)
      }
    }
  }

  #trackResult(result: CommandResult, command: Command): void {
    switch (result) {
      case CommandResult.Success: {
        this.analytics.trackEvent(AnalyticsEvent.CommandSuccess, command.name, command.type)
        break
      }
      case CommandResult.Failure: {
        this.analytics.trackEvent(AnalyticsEvent.CommandFailure, command.name, command.type)
        break
      }
      default: {
        throw new Error(`Unknown command result: ${result}`)
      }
    }
  }
}

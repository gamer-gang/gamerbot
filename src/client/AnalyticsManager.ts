import { AnalyticsReport, CommandReport, CommandType as DatabaseCommandType } from '@prisma/client'
import { DateTime } from 'luxon'
import { createHash } from 'node:crypto'
import { Command, CommandResult } from '../commands/command.js'
import { prisma } from '../prisma.js'
import type { GamerbotClient } from './GamerbotClient.js'
import { AnalyticsEvent, EventData, EventReturnType, events } from './_analytics/event.js'
import { CommandReportStats } from './_analytics/types.js'

export class AnalyticsManager {
  #initialized = false
  get initialized(): boolean {
    return this.#initialized
  }

  #report!: AnalyticsReport
  get report(): AnalyticsReport {
    if (!this.#initialized) {
      throw new Error('AnalyticsManager not initialized')
    }
    return this.#report
  }

  usersInteracted = new Set<string>()
  commandCache = new Map<string, CommandReportStats>()
  #flushingGlobal = false
  #flushingCommands = false

  constructor(public client: GamerbotClient) {
    // nothing
  }

  #ensureInitialized(): void {
    if (!this.#initialized) {
      throw new Error('AnalyticsManager not initialized')
    }
  }

  async initialize(force = false): Promise<void> {
    if (this.#initialized && !force) return

    const month = this.#getMonth()
    this.#report = await prisma.analyticsReport.upsert({
      where: { month },
      create: { month },
      update: {},
    })

    this.usersInteracted = new Set<string>()
    this.#initialized = true
  }

  async flushAll(): Promise<void> {
    this.#ensureInitialized()

    const logger = this.client.getLogger('analytics.flush')
    logger.debug(`FLUSH all ${this.#report.month.toISOString()}`)

    await this.flushGlobal()
    await this.flushCommands()
  }

  async update(): Promise<void> {
    this.#ensureInitialized()

    const logger = this.client.getLogger('analytics.update')

    const month = this.#getMonth()
    // check if month is the same, ± 1 day just in case timezones or something
    if (Math.abs(month.getTime() - this.#report.month.getTime()) < 24 * 60 * 60_000) {
      logger.debug(`UPDATE skipped, same month ${month.toISOString()}`)
      return
    }

    logger.debug('UPDATE flushing')

    await this.flushGlobal()
    await this.flushCommands()

    logger.debug('UPDATE re-initializing')

    await this.initialize(true)
  }

  /** Push global analytics changes to the database */
  async flushGlobal(): Promise<void> {
    this.#ensureInitialized()

    if (this.#flushingGlobal) {
      throw new Error('AnalyticsManager is already flushing global analytics')
    }

    const logger = this.client.getLogger('analytics.flush.global')
    logger.debug(`FLUSH global ${this.#report.month.toISOString()}`)

    this.#flushingGlobal = true

    // update global stats
    const existing = await prisma.analyticsReport.findFirst({
      where: { month: this.#report.month },
      select: { usersInteracted: true },
    })

    const usersInteracted = new Set([...this.usersInteracted, ...(existing?.usersInteracted ?? [])])

    await prisma.analyticsReport.update({
      where: { month: this.#report.month },
      data: {
        botLogins: this.#report.botLogins,
        guildCount: this.#report.guildCount || (await this.client.countGuilds()),
        userCount: this.#report.userCount || (await this.client.countUsers()),
        commandsSuccessful: this.#report.commandsSuccessful,
        commandsFailed: this.#report.commandsFailed,
        commandsSent: this.#report.commandsSent,
        usersInteracted: { set: [...usersInteracted] },
      },
    })

    // pull report from database to be safe
    this.#report = await prisma.analyticsReport.findUnique({
      where: { month: this.#report.month },
      rejectOnNotFound: true,
    })

    this.#flushingGlobal = false
  }

  /** Push all command changes to the database and clear the cache. */
  async flushCommands(): Promise<void> {
    this.#ensureInitialized()

    if (this.#flushingCommands) {
      throw new Error('AnalyticsManager is already flushing commands')
    }

    this.#flushingCommands = true

    const logger = this.client.getLogger('analytics.flush.commands')
    logger.debug(`FLUSH commands ${this.#report.month.toISOString()}`)

    for (const [command, commandStats] of this.commandCache) {
      const existing = await prisma.commandReport.findUnique({
        where: {
          command_analyticsReportMonth: {
            command,
            analyticsReportMonth: this.#report.month,
          },
        },
      })

      const usersInteracted = new Set([...commandStats.users, ...(existing?.usersInteracted ?? [])])

      await prisma.commandReport.upsert({
        where: {
          command_analyticsReportMonth: {
            command,
            analyticsReportMonth: this.#report.month,
          },
        },
        create: {
          command,
          analyticsReportMonth: this.#report.month,
          type: commandStats.type,
          sent: commandStats.sent,
          successful: commandStats.successful,
          failed: commandStats.failed,
          usersInteracted: { set: [...usersInteracted] },
        },
        update: {
          sent: { increment: commandStats.sent },
          successful: { increment: commandStats.successful },
          failed: { increment: commandStats.failed },
          usersInteracted: { set: [...usersInteracted] },
        },
      })

      this.commandCache.delete(command)
    }

    this.#flushingCommands = false
  }

  #getMonth(): Date {
    return DateTime.utc().startOf('month').toJSDate()
  }

  hashUser(userId: string): string {
    return createHash('sha1') // security not super important, just make sure we're not storing user ids
      .update(userId)
      .digest('hex')
  }

  async getCommandReport(command: string, type: DatabaseCommandType): Promise<CommandReport> {
    this.#ensureInitialized()

    const month = this.#report.month

    return (
      (await prisma.commandReport.findFirst({
        where: {
          analyticsReportMonth: month,
          command,
        },
      })) ??
      (await prisma.commandReport.create({
        data: {
          analyticsReportMonth: month,
          command,
          type,
        },
      }))
    )
  }

  trackEvent<E extends AnalyticsEvent>(event: E, ...data: EventData[E]): EventReturnType<E> {
    this.#ensureInitialized()

    const logger = this.client.getLogger('analytics.event')

    logger.debug(`TRACK ${AnalyticsEvent[event]} ${data.map((d) => d.toString()).join(' ')}`)

    return events[event](this, ...data)
  }

  trackCommandResult(result: CommandResult, command: Command): void {
    switch (result) {
      case CommandResult.Success: {
        this.trackEvent(AnalyticsEvent.CommandSuccess, command.name, command.type)
        break
      }
      case CommandResult.Failure: {
        this.trackEvent(AnalyticsEvent.CommandFailure, command.name, command.type)
        break
      }
      default: {
        throw new Error(`Unknown command result: ${result}`)
      }
    }
  }
}

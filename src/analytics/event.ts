import { CommandType as DatabaseCommandType } from '@prisma/client'
import type { CommandResult } from '../commands/command.js'
import type { AnalyticsManager } from './manager.js'
import { defaultCommandStats } from './types.js'

// needed for the @link in jsdoc comments below
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _t = CommandResult.Success

export enum AnalyticsEvent {
  /**
   * Should be tracked when the client connects to the gateway.
   */
  BotLogin,
  /**
   * Should be tracked when a command is sent and will be executed.
   */
  CommandSent,
  /**
   * Should be tracked when a command is executed successfully (see {@link CommandResult.Success}).
   */
  CommandSuccess,
  /**
   * Should be tracked when a command fails (see {@link CommandResult.Failure}).
   */
  CommandFailure,
}

export interface EventData {
  [AnalyticsEvent.BotLogin]: []
  [AnalyticsEvent.CommandSent]: [command: string, type: DatabaseCommandType, user: string]
  [AnalyticsEvent.CommandSuccess]: [command: string, type: DatabaseCommandType]
  [AnalyticsEvent.CommandFailure]: [command: string, type: DatabaseCommandType]
}

export interface AnalyticsEventReturn {
  [AnalyticsEvent.CommandSent]: number
}

export type EventReturnType<E extends AnalyticsEvent> = E extends keyof AnalyticsEventReturn
  ? AnalyticsEventReturn[E]
  : void

export const events: {
  [E in AnalyticsEvent]: (manager: AnalyticsManager, ...data: EventData[E]) => EventReturnType<E>
} = {
  [AnalyticsEvent.BotLogin]: (manager) => {
    manager.report.botLogins++
  },
  [AnalyticsEvent.CommandSent](manager, command, type, user) {
    const userHash = manager.hashUser(user)

    // update global stats
    manager.report.commandsSent++
    manager.usersInteracted.add(userHash)

    // update command stats
    const commandStats = manager.commandCache.get(command) ?? defaultCommandStats(type)
    commandStats.sent++
    commandStats.users.add(userHash)
    manager.commandCache.set(command, commandStats)

    return commandStats.sent
  },
  [AnalyticsEvent.CommandSuccess](manager, command, type) {
    // update global stats
    manager.report.commandsSuccessful++

    // update command stats
    const commandStats = manager.commandCache.get(command) ?? defaultCommandStats(type)
    commandStats.successful++
    manager.commandCache.set(command, commandStats)
  },
  [AnalyticsEvent.CommandFailure](manager, command, type) {
    // update global stats
    manager.report.commandsFailed++

    // update command stats
    const commandStats = manager.commandCache.get(command) ?? defaultCommandStats(type)
    commandStats.failed++
    manager.commandCache.set(command, commandStats)
  },
}

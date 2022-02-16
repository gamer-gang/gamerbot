import { CommandType as DatabaseCommandType } from '@prisma/client'

export interface CommandReportStats {
  type: DatabaseCommandType
  sent: number
  successful: number
  failed: number
  users: Set<string>
}

export const defaultCommandStats = (type: DatabaseCommandType): CommandReportStats => ({
  type,
  sent: 0,
  successful: 0,
  failed: 0,
  users: new Set<string>(),
})

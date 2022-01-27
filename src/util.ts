import { getTimeZones, TimeZone } from '@vvo/tzdb'
import didYouMean from 'didyoumean'
import {
  ApplicationCommandOptionChoice,
  CommandInteraction,
  CommandInteractionOption,
  ContextMenuInteraction,
} from 'discord.js'
import assert from 'node:assert'
import { Command } from './commands/command.js'
import { ChatCommandDef, MessageCommandDef, UserCommandDef } from './types.js'
import { Embed } from './util/embed.js'

export const formatOptions = (options: readonly CommandInteractionOption[]): string =>
  options
    .map((opt) => {
      const text = opt.name

      if (opt.options != null) {
        const suboptionsText = formatOptions(opt.options)

        return `${text} ${suboptionsText}`
      }

      const value = opt.value ?? opt.user?.tag ?? opt.channel?.name ?? ''

      if (value != null && value !== '') return `${text}:${value}`
      return text
    })
    .join(' ')

export const isChatCommand = (
  def: ChatCommandDef | UserCommandDef | MessageCommandDef
): def is ChatCommandDef => {
  return (
    typeof def.name === 'string' &&
    typeof (def as ChatCommandDef).description === 'string' &&
    typeof def.run === 'function'
  )
}

// convert number of bytes to human readable format
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export const insertUuidDashes = (uuid: string): string => {
  uuid = uuid.replace(/-/g, '')
  return `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(
    16,
    20
  )}-${uuid.slice(20, 32)}`
}

export const hasPermissions = (
  interaction: CommandInteraction | ContextMenuInteraction,
  command: Command
): boolean => {
  if (interaction.guild != null) {
    assert(interaction.member, 'No interaction member in permission check')
    const currentUserPermissions = interaction.member.permissions
    assert(typeof currentUserPermissions !== 'string')

    assert(interaction.channel)
    assert(interaction.channel.type !== 'DM')

    const requiredUserPermissions = command.userPermissions

    if (
      requiredUserPermissions.length > 0 &&
      requiredUserPermissions.some((permission) => !currentUserPermissions.has(permission))
    ) {
      void interaction.reply({
        embeds: [
          Embed.error(
            'You do not have the required permissions to use this command.',
            `Required: ${requiredUserPermissions.join(', ')}`
          ),
        ],
        ephemeral: true,
      })
      return false
    }

    const currentBotPermissions = interaction.channel.permissionsFor(interaction.guild.me!)

    const requiredBotPermissions = command.botPermissions
    assert(typeof requiredBotPermissions !== 'string')

    if (
      requiredBotPermissions.length > 0 &&
      requiredBotPermissions.some((permission) => !currentBotPermissions.has(permission))
    ) {
      void interaction.reply({
        embeds: [
          Embed.error(
            'I do not have the required permissions to use this command.',
            `Required: ${requiredBotPermissions.join(', ')}`
          ),
        ],
        ephemeral: true,
      })
      return false
    }

    return true
  }

  return true
}

export const matchString = (
  input: string,
  possible: string[]
): ApplicationCommandOptionChoice[] => {
  if (!input) {
    // return 25 random timezones
    const random = [...possible].sort(() => 0.5 - Math.random()).slice(0, 25)
    random.sort()
    return random.map((tz) => ({ name: tz, value: tz }))
  }

  const matches = possible.filter((match) => match.toLowerCase().includes(input.toLowerCase()))

  if (!matches.length) {
    const match = didYouMean(input, possible) as string
    if (match) {
      return [{ name: `${input} (did you mean ${match}?)`, value: match }]
    }

    return [{ name: `${input} (no results)`, value: input }]
  }

  // sort matches: matches that begin with the input, then matches that contain the input
  matches.sort((a, b) => {
    if (a.startsWith(input) && !b.startsWith(input)) {
      return -1
    } else if (!a.startsWith(input) && b.startsWith(input)) {
      return 1
    }

    return a.localeCompare(b)
  })

  return matches.slice(0, 25).map((match) => ({ name: match, value: match }))
}

// return a string like 'UTC+01:00' for a timezone offset in minutes
export const formatUtcOffset = (offset: number): string => {
  const hours = Math.floor(offset / 60)
  const sign = hours >= 0 ? '+' : '-'
  const hoursString = Math.abs(hours).toString().padStart(2, '0')
  const minutesString = (offset % 60).toString().padStart(2, '0')

  return `UTC${sign}${hoursString}:${minutesString}`
}

const timezones = getTimeZones()
export const findTimeZone = (input: string): TimeZone | undefined => {
  return timezones.find(
    (tz) =>
      input === tz.name ||
      tz.group.includes(input) ||
      tz.abbreviation === input ||
      tz.mainCities.includes(input) ||
      tz.alternativeName === input
  )
}

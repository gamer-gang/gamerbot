import { codeBlock, CommandInteractionOption } from 'discord.js'
import { IS_DEVELOPMENT } from '../constants.js'

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

// convert number of bytes to human readable format
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

// return a string like 'UTC+01:00' for a timezone offset in minutes
export const formatUtcOffset = (offset: number): string => {
  const hours = Math.floor(offset / 60)
  const sign = hours >= 0 ? '+' : '-'
  const hoursString = Math.abs(hours).toString().padStart(2, '0')
  const minutesString = (offset % 60).toString().padStart(2, '0')

  return `UTC${sign}${hoursString}:${minutesString}`
}
export const formatErrorMessage = (err: unknown): string => {
  if (IS_DEVELOPMENT) {
    if (err instanceof Error) {
      return `**${err.name}**: **${err.message}**\n\n${codeBlock(err.stack ?? '(no stack)')}`
    }
    return codeBlock(`${err}`)
  }

  if (err instanceof Error) {
    return `**${err.name}**: ${err.message}`
  }

  return `${err}`
}

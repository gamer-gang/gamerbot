import { CommandInteractionOption } from 'discord.js'
import { ChatCommandDef, MessageCommandDef, UserCommandDef } from './types.js'

export const formatOptions = (options: readonly CommandInteractionOption[]): string =>
  options
    .map((opt) => {
      const text = opt.name

      if (opt.options != null) {
        const suboptionsText = formatOptions(opt.options)

        return `${text} ${suboptionsText}`
      }

      const value = opt.value ?? opt.user?.tag ?? opt.channel?.name ?? ''

      return `${text}:${value.toString()}`
    })
    .join('\n')

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

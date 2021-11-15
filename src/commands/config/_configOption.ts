import { ApplicationCommandOptionType } from 'discord.js'
import { CommandContext } from '../context.js'

export interface ConfigOption {
  displayName: string
  internalName: string
  description: string
  type: Exclude<ApplicationCommandOptionType, 'SUB_COMMAND' | 'SUB_COMMAND_GROUP'>

  handle: (context: CommandContext) => Promise<void>
}

export function configOption(def: ConfigOption): ConfigOption {
  return def
}

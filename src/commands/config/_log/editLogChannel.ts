import type { LogChannel } from '@prisma/client'
import type { SelectMenuInteraction } from 'discord.js'
import type { CommandResult } from '../../command.js'
import type { CommandContextWithGuild } from '../_configOption.js'

const editLogChannel = async (
  context: CommandContextWithGuild,
  logChannels: LogChannel[],
  component: SelectMenuInteraction
): Promise<CommandResult> => {
  throw new Error('Method not implemented.')
}

export default editLogChannel

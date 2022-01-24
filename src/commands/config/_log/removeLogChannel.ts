import { LogChannel } from '@prisma/client'
import { SelectMenuInteraction } from 'discord.js'
import { CommandResult } from '../../command.js'
import { CommandContextWithGuild } from '../_configOption.js'

const removeLogChannel = async (
  context: CommandContextWithGuild,
  logChannels: LogChannel[],
  component: SelectMenuInteraction
): Promise<CommandResult> => {
  throw new Error('Method not implemented.')
}

export default removeLogChannel

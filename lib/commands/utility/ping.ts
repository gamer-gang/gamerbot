import { ApplicationCommandType } from 'discord.js'
import command, { CommandResult } from '../command.js'

const COMMAND_PING = command(ApplicationCommandType.ChatInput, {
  name: 'ping',
  description: 'Pong!',

  async run(context) {
    const { interaction } = context

    const start = process.hrtime.bigint()
    await interaction.reply('Ping! ...')
    const end = process.hrtime.bigint()

    await interaction.editReply(
      `Pong (hot)! ${((end - start) / 1_000_000n).toLocaleString()}ms`
    )
    return CommandResult.Success
  },
})

export default COMMAND_PING

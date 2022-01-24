import command, { CommandResult } from '../command.js'

const COMMAND_PING = command('CHAT_INPUT', {
  name: 'ping',
  description: 'Pong!',

  async run(context) {
    const { interaction } = context

    const start = process.hrtime()
    await interaction.reply('Ping! ...')
    const end = process.hrtime(start)

    await interaction.editReply(`Pong! (${end[0] * 1000 + end[1] / 1000000}ms)`)
    return CommandResult.Success
  },
})

export default COMMAND_PING

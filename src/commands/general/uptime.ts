import { Duration } from 'luxon'
import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'

const COMMAND_UPTIME = command('CHAT_INPUT', {
  name: 'uptime',
  description: 'Show uptime of current server process/shard.',

  async run(context) {
    const { interaction } = context

    const uptime = Math.floor(process.uptime())
    const parts = Duration.fromObject({
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: uptime,
    })
      .normalize()
      .toObject()

    const units = ['years', 'months', 'days', 'hours', 'minutes', 'seconds'] as const

    const segments = units.map((unit) => {
      const count = parts[unit]
      return count && `${count} ${unit.replace(/s$/, '')}${count > 1 ? 's' : ''}`
    })

    await interaction.reply({
      embeds: [Embed.info(`**Uptime**: ${segments.filter((v) => !!v).join(', ')}`)],
    })
    return CommandResult.Success
  },
})

export default COMMAND_UPTIME

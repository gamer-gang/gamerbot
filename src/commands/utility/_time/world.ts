import { DateTime } from 'luxon'
import { Embed } from '../../../util/embed.js'
import { CommandResult } from '../../command.js'
import type { TimeHandler } from '../time.js'

const COMMON_ZONES: string[] = [
  'Pacific/Honolulu',
  'America/Los_Angeles',
  'America/New_York',
  'Europe/London',
  'Europe/Athens',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
]

const TIME_WORLD: TimeHandler = async (context) => {
  const { interaction } = context

  const embed = new Embed({ title: 'World Time' })

  const time = DateTime.utc()

  for (const zone of COMMON_ZONES) {
    const formatted = time
      .setZone(zone)
      .toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY, { locale: interaction.locale })
    embed.addField(zone, formatted, true)
  }

  await interaction.reply({ embeds: [embed] })
  return CommandResult.Success
}

export default TIME_WORLD

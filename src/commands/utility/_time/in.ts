import { DateTime } from 'luxon'
import { findTimeZone, formatUtcOffset } from '../../../util.js'
import { Embed } from '../../../util/embed.js'
import { CommandResult } from '../../command.js'
import { TimeHandler } from '../time.js'

const TIME_IN: TimeHandler = async (context) => {
  const { interaction } = context
  const zoneInput = interaction.options.getString('zone', true)

  const zone = findTimeZone(zoneInput)

  if (!zone || !DateTime.now().setZone(zone.name).isValid) {
    await interaction.reply({
      embeds: [Embed.error('Invalid time zone')],
      ephemeral: true,
    })
    return CommandResult.Success
  }

  const time = DateTime.local().setZone(zone.name)

  const embed = new Embed({
    author: { name: `Time in ${zoneInput}${zoneInput !== zone.name ? ` (${zone.name})` : ''}` },
    title: time.toLocaleString(DateTime.DATETIME_HUGE_WITH_SECONDS),
    description: `**${time.toISO({ includeOffset: true, suppressMilliseconds: true })}**`,
    footer: { text: `Current offset: ${formatUtcOffset(zone.currentTimeOffsetInMinutes)}` },
  })

  await interaction.reply({ embeds: [embed] })

  return CommandResult.Success
}

export default TIME_IN

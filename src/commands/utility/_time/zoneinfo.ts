import { stripIndent } from 'common-tags'
import { DateTime } from 'luxon'
import { findTimeZone, formatUtcOffset } from '../../../util.js'
import { Embed } from '../../../util/embed.js'
import { CommandResult } from '../../command.js'
import { TimeHandler } from '../time.js'

const TIME_ZONEINFO: TimeHandler = async (context) => {
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
    author: { name: 'Time Zone Information' },
    title: `${zoneInput}${zoneInput !== zone.name ? ` (${zone.name})` : ''}`,
    description: stripIndent`
      **Alternate names:** ${zone.alternativeName}, ${zone.abbreviation}
      **Current offset:** ${formatUtcOffset(zone.currentTimeOffsetInMinutes)}
      **Continent:** ${zone.continentName} (${zone.continentCode})
      **Country:** ${zone.countryName} (${zone.countryCode})
      **Main Cities:** ${zone.mainCities.join(', ')}
      **Group:** ${zone.group.join(', ')}
    `,
  })

  embed.addField(
    'Current Time',
    stripIndent`
      ${time.toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY)}
      ${time.toISO({ includeOffset: true, suppressMilliseconds: true })}s
    `,
    true
  )

  await interaction.reply({ embeds: [embed] })

  return CommandResult.Success
}

export default TIME_ZONEINFO

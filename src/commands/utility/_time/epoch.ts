import { stripIndent } from 'common-tags'
import { DateTime } from 'luxon'
import { Embed } from '../../../util/embed.js'
import { CommandResult } from '../../command.js'
import { TimeHandler } from '../time.js'

export const TIME_EPOCH: TimeHandler = async (context) => {
  const { interaction } = context

  const time = DateTime.utc()

  const embed = new Embed({
    title: 'Current Epoch Time',
    description: stripIndent`
      ${time.toLocaleString(DateTime.DATETIME_FULL_WITH_SECONDS)}
      ${time.toISO({ includeOffset: true, suppressMilliseconds: true })}

      **Seconds:** ${Math.floor(time.toSeconds())}
      **Milliseconds:** ${time.toMillis()}
    `,
  })

  await interaction.reply({ embeds: [embed] })

  return CommandResult.Success
}

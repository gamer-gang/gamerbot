import { stripIndents } from 'common-tags'
import { Formatters } from 'discord.js'
import emojiRegex from 'emoji-regex'
import stringLength from 'string-length'
import unicode, { type Character } from 'unicode/category/index.js'
import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'

const formatCodePoints = (str: string): string => {
  const codePoints = []

  for (const codePoint of str) {
    const digits = codePoint.codePointAt(0)!.toString(16).padStart(4, '0')
    const formatted = digits.length > 4 ? `\\u{${digits}}` : `\\u${digits}`
    codePoints.push(formatted)
  }

  return codePoints.join(' ')
}

const COMMAND_CHARACTER = command('CHAT_INPUT', {
  name: 'character',
  description: 'Show information about an ascii/unicode/whatever character.',
  examples: [
    {
      options: { character: '🐶' },
      description: 'Show information about the dog emoji.',
    },
    {
      options: { character: '笑' },
      description: 'Show information about the Chinese character 笑.',
    },
  ],
  options: [
    {
      name: 'character',
      description: 'The character to show information about.',
      type: 'STRING',
      required: true,
    },
  ],
  async run(context) {
    const { interaction, options } = context

    let input = options.getString('character', true).trim()

    const codePointRegex = /^(?:U\+)?([0-9a-f]{4,6})$/i

    if (codePointRegex.test(input)) {
      // looks like a code point
      const hex = codePointRegex.exec(input)![1]
      input = String.fromCodePoint(parseInt(hex, 16))
    }

    if (stringLength(input) !== 1) {
      await interaction.reply({
        embeds: [
          Embed.error(
            '**Input must be exactly one character**',
            `Input was: ${Formatters.inlineCode(input)}`
          ),
        ],
        ephemeral: true,
      })
      return CommandResult.Success
    }

    let codePoint = ''
    let charCodes: string[] = []

    // must use for..of because a .split('').map does not handle UTF-16 surrogate pairs correctly
    for (const character of input) {
      // if variable is already truthy, we already have one character already
      if (codePoint.length > 0) {
        const codePoints = formatCodePoints(input)
        const embed = Embed.error(
          '**Input must be exactly one character**',
          `Input was: ${Formatters.inlineCode(codePoints)}`
        )

        if (codePoints.includes('\\ufe0f') || codePoints.includes('\\u200d')) {
          embed.setFooter({
            text: 'Note: some emojis are composed of a number of different emojis put together and thus do not count as single characters.',
          })
        }

        await interaction.reply({
          embeds: [embed],
          ephemeral: true,
        })
        return CommandResult.Success
      }
      const number = character.codePointAt(0)!
      codePoint = number.toString(16).padStart(4, '0')
      // surrogate pair
      if (number > 0xffff) {
        charCodes = character.split('').map((code) => code.charCodeAt(0).toString(16))
      }
    }

    // no character
    if (codePoint == null) {
      await interaction.reply({
        embeds: [Embed.error('Input must be exactly one character')],
        ephemeral: true,
      })
      return CommandResult.Success
    }

    let data: Character | undefined
    for (const k of Object.keys(unicode)) {
      if (k === 'default') continue
      const category = unicode[k as Exclude<keyof typeof unicode, 'default'>]
      const codePointNum = input.codePointAt(0)!

      const potentialData = category[codePointNum]
      if (potentialData != null) {
        data = potentialData
        break
      }
    }

    const embed = new Embed({
      author: data != null ? { name: `Character ${input}` } : undefined,
      title:
        data != null
          ? `${data.name}${data.unicode_name ? ` (${data.unicode_name})` : ''}`
          : `Character ${input}`,
      description: stripIndents`
        ${emojiRegex().test(input) ? `${input}\n` : ''}
        https://graphemica.com/${encodeURIComponent(input)}`,
    })

    embed.addField('Code point', `U+${codePoint.toUpperCase()}`, true)

    if (charCodes.length > 0) {
      embed.addField(
        'Surrogate pair',
        charCodes.map((c) => `U+${c.toUpperCase()}`).join(', '),
        true
      )
    }

    if (data != null) embed.addField('Category', data.category, true)

    embed.addField(
      'Input',
      stripIndents`
        JS: \`\\u${charCodes.length === 0 ? codePoint : `{${codePoint}}`}\`
        URL: \`${encodeURIComponent(input)}\`
        HTML: \`&#x${codePoint};\` or \`&#${parseInt(codePoint, 16)};\`
      `
    )

    await interaction.reply({ embeds: [embed] })
    return CommandResult.Success
  },
})

export default COMMAND_CHARACTER

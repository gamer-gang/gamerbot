import { stripIndents } from 'common-tags'
import emojiRegex from 'emoji-regex'
import stringLength from 'string-length'
import { Character } from 'unicode/category/index.js'
import '../../types/unicode.d.ts'
import { Embed } from '../../util/embed.js'
import command from '../command.js'

// eslint-disable-next-line import/extensions
const unicode = import('unicode/category/index.js')

const COMMAND_CHARACTER = command('CHAT_INPUT', {
  name: 'character',
  description: 'Show information about an ascii/unicode/whatever character.',
  options: [
    {
      name: 'character',
      description: 'The character to show information about.',
      type: 'STRING',
      required: true,
    },
  ],
  async run(context) {
    const { interaction } = context

    let input = interaction.options.getString('character', true).trim()

    const codePointRegex = /^(?:U\+)?([0-9a-f]{4,6})$/i

    if (codePointRegex.test(input)) {
      // looks like a code point
      const hex = codePointRegex.exec(input)![1]
      input = String.fromCodePoint(parseInt(hex, 16))
    }

    if (stringLength(input) !== 1) {
      await interaction.reply({
        embeds: [Embed.error('Input must be exactly one character')],
        ephemeral: true,
      })
      return
    }

    let codePoint = ''
    let charCodes: string[] = []

    // must use for..of because a .split('').map does not handle UTF-16 surrogate pairs correctly
    for (const character of input) {
      // if variable is already truthy, we already have one character already
      if (codePoint != null) {
        await interaction.reply({
          embeds: [Embed.error('Input must be exactly one character')],
          ephemeral: true,
        })
        return
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
      return
    }

    let data: Character | undefined

    const categories = await unicode
    for (const k of Object.keys(categories)) {
      if (k === 'default') continue
      const potentialData =
        categories[k as Exclude<keyof typeof categories, 'default'>][input.codePointAt(0)!]
      if (potentialData != null) {
        data = potentialData
        break
      }
    }

    const embed = new Embed({
      author: data != null ? { name: `Character ${input}` } : undefined,
      title:
        data != null
          ? `${data.name}${data.unicode_name != null ? ` (${data.unicode_name})` : ''}`
          : `Character ${input}`,
      description: stripIndents`
        ${emojiRegex().test(input) ? `${input}\n` : ''}
        https://graphemica.com/${encodeURIComponent(input)}`,
    }).addField('Code point', `U+${codePoint.toUpperCase()}`, true)

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
  },
})

export default COMMAND_CHARACTER

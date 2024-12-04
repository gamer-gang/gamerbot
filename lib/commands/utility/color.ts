import { createCanvas } from '@napi-rs/canvas'
import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js'
import { Color, HslTriple, RgbTriple } from '../../util/color.js'
import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'

const hexCodeRegex = /^#?([a-f0-9]{3}|[a-f0-9]{6})$/i
const rgbRegex =
  /^(?:rgb(?:\s*\(|\s+))?\s*(\d{1,3})(?:,\s*|\s+)(\d{1,3})(?:,\s*|\s+)(\d{1,3})\s*\)?$/i
const hslRegex =
  /^hsl(?:\s*\(|\s+)\s*(\d+(?:\.\d+)?)(?:[°º]| ?deg(?:rees)?)?(?:,\s*|\s+)(\d+(?:\.\d+)?)%?(?:,\s*|\s+)(\d+(?:\.\d+)?)%?\s*\)?$/i

const COMMAND_COLOR = command(ApplicationCommandType.ChatInput, {
  name: 'color',
  description: 'Get information about a color.',
  longDescription:
    'Get information about a color. Colors can be specified as hexadecimal (e.g. #ff0000), RGB (e.g. rgb(255, 0, 0)), or HSL (e.g. hsl(0°, 100%, 50%)).',
  examples: [
    {
      options: { color: '#0284c7' },
      description: 'Get information about the color #0284c7.',
    },
    {
      options: { color: 'rgb(2, 132, 199)' },
      description: 'Get information about the color rgb(2, 132, 199).',
    },
    {
      options: { color: 'hsl(200°, 98.01%, 39.41%)' },
      description: 'Get information about the color hsl(200°, 98.01%, 39.41%).',
    },
  ],
  options: [
    {
      name: 'color',
      description: 'The color to get information about.',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  async run(context) {
    const { interaction, options } = context

    const input = options.getString('color', true)

    const colorPatterns = [hexCodeRegex, rgbRegex, hslRegex]

    let exec
    let patternName
    for (const pattern of colorPatterns) {
      exec = pattern.exec(input)
      patternName = (['hex', 'rgb', 'hsl'] as const)[colorPatterns.indexOf(pattern)]
      if (exec != null) break
    }

    if (exec == null) {
      await interaction.reply('Invalid color. Use a hex code, RGB, or HSL color.')
      return CommandResult.Success
    }

    let color
    if (patternName === 'hex') {
      color = Color.from(exec[1])
    } else {
      color = Color.from(
        exec.slice(1, 4).map((s) => parseFloat(s)) as RgbTriple | HslTriple,
        patternName
      )
    }

    const canvas = createCanvas(128, 128)
    const c = canvas.getContext('2d')

    c.fillStyle = color.hex
    c.fillRect(0, 0, canvas.width, canvas.height)

    const hexText = color.hex

    const rgbText = `rgb(${color.rgb.join(', ')})`

    const hslText = `hsl(${Math.round(color.hsl[0])}°, ${
      Math.round(color.hsl[1] * 100_00) / 1_00
    }%, ${Math.round(color.hsl[2] * 100_00) / 1_00}%)`

    const png = canvas.toBuffer('image/png')

    const embed = new Embed({
      title: `Color ${color.hex}`,
      thumbnail: {
        url: 'attachment://color.png',
      },
      description: `**Hex:** ${hexText}\n**RGB:** ${rgbText}\n**HSL:** ${hslText}`,
    })

    await interaction.reply({
      embeds: [embed],
      files: [{ attachment: png, name: 'color.png' }],
    })
    return CommandResult.Success
  },
})

export default COMMAND_COLOR

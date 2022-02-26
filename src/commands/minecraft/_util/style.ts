import { SKRSContext2D } from '@napi-rs/canvas'
import _ from 'lodash'
import * as s from '../../../style.js'
import { Color } from '../../../util/color.js'

export const transaction = <T>(c: SKRSContext2D, f: () => T): T => {
  c.save()
  const ret = f()
  c.restore()
  return ret
}

export const colors = {
  black: Color.from(0x000000),
  dark_blue: Color.from(0x0000aa),
  dark_green: Color.from(0x00aa00),
  dark_aqua: Color.from(0x00aaaa),
  dark_red: Color.from(0xaa0000),
  dark_purple: Color.from(0xaa00aa),
  gold: Color.from(0xffaa00),
  gray: Color.from(0xaaaaaa),
  dark_gray: Color.from(0x555555),
  blue: Color.from(0x5555ff),
  green: Color.from(0x55ff55),
  aqua: Color.from(0x55ffff),
  red: Color.from(0xff5555),
  light_purple: Color.from(0xff55ff),
  yellow: Color.from(0xffff55),
  white: Color.from(0xffffff),
}

export const colorCode = (num: number): Color =>
  colors[Object.keys(colors)[num] as keyof typeof colors]

interface Text {
  color: Color
  text: string
}

export const parseFormattedText = (text: string, defaultStyle = 0xdfe0e4): Text[] => {
  if (!text.includes('§')) return [{ text, color: Color.from(defaultStyle) }]
  return text
    .split('§')
    .filter((t) => Boolean(t))
    .map((segment) => {
      if (!/^[A-Za-z0-9]$/.test(segment[0] ?? '')) throw new Error('invalid formatted string')

      return {
        color: segment[0] === 'r' ? Color.from(defaultStyle) : colorCode(parseInt(segment[0], 16)),
        text: segment.substring(1),
      }
    })
}

export const stripFormatting = (text: string): string => text.replace(/§[0-9a-f]/gi, '')

export const drawFormattedText = (
  c: SKRSContext2D,
  text: Text[] | string,
  x: number,
  y: number,
  textAlign: 'left' | 'right' = 'left'
): number =>
  transaction(c, () => {
    const initialStyle = c.fillStyle

    if (typeof text === 'string') {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      text = parseFormattedText(text, parseInt(initialStyle.toString().replace(/#/g, ''), 16))
    }

    const charWidth = s.getCharWidth(+c.font.split('px')[0])

    const textWidth = (textAlign === 'left' ? text : _.clone(text).reverse()).reduce(
      (x, segment) => {
        c.fillStyle = segment.color.hex
        c.fillText(segment.text, x, y)

        return textAlign === 'left'
          ? x + charWidth * segment.text.length
          : x - charWidth * segment.text.length
      },
      x
    )

    return textWidth
  })

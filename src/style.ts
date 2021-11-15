import { createCanvas, GlobalFonts, SKRSContext2D } from '@napi-rs/canvas'
import { resolvePath } from './util/path.js'
export const headerHeight = 44
export const subheaderHeight = 28
export const mainHeight = 40
export const padding = 16
export const margin = 0
export const fgColor = '#dfe0e4'
export const fgAltColor = '#a8abb5'
export const bgColor = '#1e2024'

let fontLoaded = false
/**
 * @returns false when font was already present, otherwise true
 */
export const assertFontLoaded = (): boolean => {
  if (fontLoaded) return false

  fontLoaded = true
  GlobalFonts.registerFromPath(resolvePath('assets/RobotoMono-Regular-NF.ttf'))
  return true
}

export const font = (px: number): string => {
  assertFontLoaded()
  return `${px}px RobotoMono Nerd Font`
}
export const round = (num: number): number => Math.round((num + Number.EPSILON) * 100) / 100
export const getCharWidth = (measure: number | SKRSContext2D, char = 'A'): number => {
  assertFontLoaded()
  if (typeof measure === 'number') {
    const tester = createCanvas(measure, measure)
    const c = tester.getContext('2d')
    c.fillStyle = fgColor
    c.strokeStyle = fgColor
    c.textAlign = 'left'
    c.font = font(measure)
    return c.measureText(char).width
  }
  return getCharWidth(+measure.font.split('px')[0])
}

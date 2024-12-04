export type ColorFormat = 'number' | 'hex' | 'plain' | 'rgb' | 'hsl'
export type RgbTriple = [r: number, g: number, b: number]
export type HslTriple = [h: number, s: number, l: number]

export const hslToRgb = (h: number, s: number, l: number): RgbTriple => {
  const f = (n: number): number => {
    const k = (n + h / 30) % 12
    const a = s * Math.min(l, 1 - l)
    const color = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(color * 255)
  }
  return [f(0), f(8), f(4)]
}

export const rgbToHsl = (r: number, g: number, b: number): HslTriple => {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const value = max
  const min = Math.min(r, g, b)
  const chroma = max - min
  const lightness = (max + min) / 2

  let hue
  if (chroma === 0) hue = 0

  switch (value) {
    case r:
      hue = (0 + (g - b) / chroma) * 60
      break
    case g:
      hue = (2 + (b - r) / chroma) * 60
      break
    case b:
      hue = (4 + (r - g) / chroma) * 60
      break
    default:
      throw new Error('Invalid RGB color')
  }

  let saturation
  if (lightness === 0 || lightness === 1) {
    saturation = 0
  } else {
    saturation = (value - lightness) / Math.min(lightness, 1 - lightness)
  }

  return [hue, saturation, lightness]
}

export class Color {
  static from(input: RgbTriple | HslTriple | number | string, type?: 'rgb' | 'hsl'): Color {
    let num: number

    if (typeof input === 'number') {
      num = input
    } else if (Array.isArray(input)) {
      num = parseInt(
        (type === 'hsl' ? hslToRgb(...(input as HslTriple)) : input)
          .map((value) => value.toString(16).padStart(2, '0'))
          .join(''),
        16
      )
      if (isNaN(num)) throw new Error('Invalid HSL/RGB color')
    } else {
      input = input.replace(/#/g, '')
      if (input.length === 3) {
        // double each character
        input = input
          .split('')
          .map((c) => c + c)
          .join('')
      } else if (input.length !== 6) {
        throw new Error('Hex value input to Color.from() not 3 or 6 in length')
      }

      num = parseInt(input, 16)
      if (isNaN(num)) throw new Error('Invalid hexidecimal color')
    }

    return new Color(num)
  }

  #num: number
  #rgb: RgbTriple
  #string: string

  constructor(num: number) {
    this.#num = num
    this.#string = this.#num.toString(16).padStart(6, '0')

    const r = this.#string.slice(0, 2)
    const g = this.#string.slice(2, 4)
    const b = this.#string.slice(4, 6)

    this.#rgb = [r, g, b].map((s) => parseInt(s, 16)) as RgbTriple
  }

  get number(): number {
    return this.#num
  }

  get plain(): string {
    return this.#string
  }

  get rgb(): RgbTriple {
    return [...this.#rgb]
  }

  get hsl(): HslTriple {
    return rgbToHsl(...this.#rgb)
  }

  get hex(): string {
    return `#${this.#string}`
  }
}

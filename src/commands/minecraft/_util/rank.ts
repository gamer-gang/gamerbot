// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference lib="DOM" />
import type { SKRSContext2D } from '@napi-rs/canvas'
import type { Player } from 'hypixel-types'
import assert from 'node:assert'
import * as s from '../../../style.js'
import type { Color } from '../../../util/color.js'
import { colors, parseFormattedText, stripFormatting } from './style.js'

export const rankWeights = {
  NON_DONOR: 1,
  VIP: 2,
  VIP_PLUS: 3,
  MVP: 4,
  MVP_PLUS: 5,
  SUPERSTAR: 6,
  YOUTUBER: 60,
  JR_HELPER: 70,
  HELPER: 80,
  MODERATOR: 90,
  ADMIN: 100,
}

export type Rank = keyof typeof rankWeights

export const rankPrefixes: Record<Rank, string> = {
  NON_DONOR: '§7',
  VIP: '§a[VIP]',
  VIP_PLUS: '§a[VIP§6+§a]',
  MVP: '§b[MVP]',
  MVP_PLUS: '§b[MVP§c*§b]',
  SUPERSTAR: '§6[MVP§c**§6]',
  YOUTUBER: '§c[§fYOUTUBE§c]',
  JR_HELPER: '§9[JR HELPER]',
  HELPER: '§9[HELPER]',
  MODERATOR: '§2[MOD]',
  ADMIN: '§c[ADMIN]',
}

export const isStaff = (player: Player): boolean => {
  const rank = player.rank ?? 'NORMAL'
  return rank !== 'NORMAL'
}

export const getRank = (player: Player): Rank => {
  let out: Rank | undefined

  if (isStaff(player)) out = player.rank as Rank
  ;['monthlyPackageRank', 'newPackageRank', 'packageRank'].forEach((key) => {
    const rank = player[key]
    if (rank === 'NONE') return
    if (
      rank != null &&
      (out == null || (rankWeights[rank as Rank] ?? 0) > (out != null ? rankWeights[out] : 0))
    ) {
      out = rank as Rank
    }
  })

  out ??= 'NON_DONOR'

  return out
}

export const getRankPlaintext = (player: Player): string => {
  return stripFormatting(rankPrefixes[getRank(player)])
}

export const drawRank = (
  c: SKRSContext2D,
  player: Player,
  x = s.padding,
  y = s.padding + s.headerHeight
): [width: number, nameColor: Color] => {
  c.save()

  const charWidth = s.getCharWidth(c)

  const rank = getRank(player)

  if (rank === 'NON_DONOR') {
    return [x, colors.gray]
  }

  const split = parseFormattedText(rankPrefixes[rank]).map((segment) => {
    if (/^\*+$/.test(segment.text)) {
      segment.color = colors[(player.rankPlusColor ?? 'red').toLowerCase() as keyof typeof colors]
      segment.text = segment.text.replace(/\*/g, '+')
    }

    return segment
  })

  assert(split.every((s) => s.text != null))
  const prefixWidth = split.reduce((offset, segment) => {
    c.fillStyle = segment.color.hex
    c.fillText(segment.text, offset - charWidth * 0.2, y)

    const adjustedCharWidth = segment.text.includes('⚝') ? s.getCharWidth(c, '⚝') : charWidth

    return offset + adjustedCharWidth * segment.text.length
  }, x)

  c.restore()

  return [prefixWidth === x ? x : prefixWidth + charWidth / 2, split[0].color]
}

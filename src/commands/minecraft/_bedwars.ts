/* eslint-disable @typescript-eslint/naming-convention */
import { createCanvas, Image } from '@napi-rs/canvas'
import { Bedwars, Player } from 'hypixel-types'
import _ from 'lodash'
import hash from 'object-hash'
import * as s from '../../style.js'
import { insertUuidDashes } from '../../util.js'
import { statsProvider, StatsProviderResponse } from './_statsProvider.js'
import {
  drawPrestige,
  getExpForLevel,
  getLevelForExp,
  getPrestigePlaintext,
} from './_util/bedwarsPrestige.js'
import { drawRank, getRankPlaintext } from './_util/rank.js'
import { colorCode, drawFormattedText, stripFormatting, transaction } from './_util/style.js'

const imageCache = new Map<string, StatsProviderResponse>()

const columns: { [key: string]: string } = {
  K: 'kills',
  D: 'deaths',
  KDR: '',
  FK: 'final_kills',
  FD: 'final_deaths',
  FKDR: '',
  W: 'wins',
  L: 'losses',
  'W/L': '',
  Beds: 'beds_broken',
}

const rows: { [key: string]: string } = {
  Solos: 'eight_one_',
  Doubles: 'eight_two_',
  '3v3v3v3': 'four_three_',
  '4v4v4v4': 'four_four_',
  '4v4': 'two_four_',
  Overall: '',
}

const noData: Bedwars = {
  eight_one_kills: 0,
  eight_one_deaths: 0,
  eight_one_final_kills: 0,
  eight_one_final_deaths: 0,
  eight_one_wins: 0,
  eight_one_losses: 0,
  eight_one_beds_broken: 0,
  eight_two_kills: 0,
  eight_two_deaths: 0,
  eight_two_final_kills: 0,
  eight_two_final_deaths: 0,
  eight_two_wins: 0,
  eight_two_losses: 0,
  eight_two_beds_broken: 0,
  four_three_kills: 0,
  four_three_deaths: 0,
  four_three_final_kills: 0,
  four_three_final_deaths: 0,
  four_three_wins: 0,
  four_three_losses: 0,
  four_three_beds_broken: 0,
  four_four_kills: 0,
  four_four_deaths: 0,
  four_four_final_kills: 0,
  four_four_final_deaths: 0,
  four_four_wins: 0,
  four_four_losses: 0,
  four_four_beds_broken: 0,
  two_four_kills: 0,
  two_four_deaths: 0,
  two_four_final_kills: 0,
  two_four_final_deaths: 0,
  two_four_wins: 0,
  two_four_losses: 0,
  two_four_beds_broken: 0,
  kills: 0,
  deaths: 0,
  final_kills: 0,
  final_deaths: 0,
  wins: 0,
  losses: 0,
  beds_broken: 0,
}

/* eslint-disable @typescript-eslint/indent */
function findCanvasWidth({
  stats,
  player,
  leftHeader,
  rightHeader,
  leftSubheaders,
  rightSubheaders,
  avatar,
}: {
  stats: { [row: string]: { [column: string]: string } }
  player: Player
  leftHeader: string
  rightHeader: string
  leftSubheaders: string[]
  rightSubheaders: string[]
  avatar?: Image
}): {
  width: number
  statColumnWidths: number[]
  gamemodeColumnWidth: number
} {
  /* eslint-enable @typescript-eslint/indent */
  const tester = createCanvas(128, 128)
  const tc = tester.getContext('2d')

  // max width of the first column (gamemode)
  tc.textAlign = 'left'
  tc.font = s.font(s.headerHeight)
  const gamemodeColumnWidth = Math.max(...Object.keys(rows).map((row) => tc.measureText(row).width))

  // widths of each column
  tc.font = s.font(s.mainHeight)
  const statColumnWidths = Object.keys(columns).map((col) => {
    return (
      Math.max(
        // column header
        tc.measureText(col).width,
        // column data
        ...Object.keys(rows).map((mode) => tc.measureText(stats[mode][col].toString()).width)
      ) +
      s.padding * 0.75
    )
  })

  // total characters in the header
  const totalHeaderChars =
    getRankPlaintext(player).length +
    leftHeader.length +
    rightHeader.length +
    getPrestigePlaintext(player).length +
    8

  // total number of subheaders
  const totalSubheaders = Math.max(leftSubheaders.length, rightSubheaders.length)

  // total characters in the subheader
  const totalSubheaderChars = _.range(totalSubheaders)
    .map(
      (i) =>
        stripFormatting(leftSubheaders[i] ?? '').length +
        stripFormatting(rightSubheaders[i] ?? '').length +
        8
    )
    .reduce((a, b) => Math.max(a, b), 0)

  const totalColumnWidth =
    // gamemode column
    gamemodeColumnWidth +
    // some padding
    s.padding * 3 +
    // column widths of stat column
    statColumnWidths.map((c) => c + s.padding * 2).reduce((a, b) => a + b, 0)

  const width = Math.round(
    Math.max(
      // header
      (avatar?.width ?? 0) + s.getCharWidth(s.headerHeight) * totalHeaderChars,
      // subheader
      (avatar?.width ?? 0) + s.getCharWidth(s.subheaderHeight) * totalSubheaderChars,
      // data
      totalColumnWidth
    )
  )

  return { width, statColumnWidths, gamemodeColumnWidth }
}

const STATS_PROVIDER_BEDWARS = statsProvider('bedwars', {
  async makeStats(player, avatar) {
    let apiData = player.stats.Bedwars
    apiData ??= noData

    const dataHash = hash({ stats: apiData, avatar: avatar?.src.buffer }, { algorithm: 'md5' })
    if (imageCache.has(dataHash)) {
      return imageCache.get(dataHash)!
    }

    imageCache.forEach((v, k) => {
      if (v.uuid === player.uuid) imageCache.delete(k)
    })

    const level = getLevelForExp(apiData.Experience ?? 0)
    const levelExp = getExpForLevel(level)

    const stats: { [row: string]: { [column: string]: string } } = {}

    Object.keys(rows).forEach((row) => {
      const rowData: { [column: string]: number } = {}

      Object.keys(columns).forEach((col) => {
        const key = `${rows[row]}${columns[col]}_bedwars`

        rowData[col] = (apiData[key] as number) ?? 0
      })

      rowData.KDR = s.round(rowData.K / Math.max(rowData.D, 1))
      rowData.FKDR = s.round(rowData.FK / Math.max(rowData.FD, 1))
      rowData['W/L'] = s.round(rowData.W / Math.max(rowData.L, 1))

      Object.keys(rowData).forEach((col) => {
        let stringVal = ''

        if (['KDR', 'FKDR', 'W/L'].includes(col) && rowData[col] === 0) {
          stringVal = ':('
        }
        stats[row] ??= {}
        stats[row][col] =
          // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
          stringVal || (isFinite(rowData[col]) ? rowData[col].toLocaleString() : '-')
      })
    })

    const winstreak = (apiData.winstreak ?? 0).toLocaleString()
    const coins = (apiData.coins ?? 0).toLocaleString()
    const gamesPlayed = apiData.games_played_bedwars ?? 0
    const bblr = s.round((apiData.beds_broken_bedwars ?? 0) / (apiData.beds_lost_bedwars ?? 0))
    const currentExp = Math.floor(((level % 1) * levelExp) / 10) * 10

    const leftHeader = player.displayname
    const leftSubheaders = [
      insertUuidDashes(player.uuid), //
      `generated ${new Date().toISOString()}`,
    ]

    const rightHeader = `${winstreak} ws  ${coins} coins`
    const rightSubheaders = [
      `§b${currentExp}§r/§a${levelExp}§r to next level`,
      `Games Played: ${gamesPlayed}  BBLR: ${bblr}`,
    ]

    const { width: optimalWidth, statColumnWidths } = findCanvasWidth({
      stats,
      player,
      leftHeader,
      rightHeader,
      leftSubheaders,
      rightSubheaders,
      avatar,
    })

    const canvas = createCanvas(
      optimalWidth,
      (Object.keys(rows).length + 3) * (s.mainHeight + 2 * s.padding) +
        s.headerHeight +
        s.padding * 2 +
        s.margin * 2 -
        s.mainHeight
    )

    const c = canvas.getContext('2d')

    // fill background
    transaction(c, () => {
      c.fillStyle = s.bgColor
      c.fillRect(0, 0, canvas.width, canvas.height)
    })

    c.fillStyle = s.fgColor
    c.strokeStyle = s.fgColor
    c.lineWidth = 0.5
    c.imageSmoothingEnabled = true
    c.imageSmoothingQuality = 'high'
    c.font = s.font(s.headerHeight)

    const width = canvas.width - s.margin * 2
    const height = canvas.height - s.margin * 2

    // draw avatar
    avatar != null && c.drawImage(avatar, s.padding, s.padding)

    // draw rank and left header
    transaction(c, () => {
      c.fillStyle = s.fgColor

      const [nameOffset, nameColor] = drawRank(
        c,
        player,
        (avatar?.width ?? 0) + (avatar != null ? 2 : 1) * s.padding
      )
      c.fillStyle = nameColor.hex
      c.fillText(leftHeader, nameOffset, s.padding + s.headerHeight)
    })

    // draw right header
    transaction(c, () => {
      c.font = s.font(s.headerHeight)

      c.textAlign = 'right'
      c.translate(-(canvas.width / 2), 0)

      c.fillText(
        rightHeader,
        drawPrestige(c, player) - s.getCharWidth(c) * 2,
        s.padding + s.headerHeight
      )
    })

    // draw subheaders
    transaction(c, () => {
      c.font = s.font(s.subheaderHeight)
      c.fillStyle = colorCode(0x7).hex

      leftSubheaders.forEach((line, i) => {
        drawFormattedText(
          c,
          line,
          (avatar?.width ?? 0) + (avatar != null ? 2 : 1) * s.padding,
          s.headerHeight + (i + 1) * s.subheaderHeight + (2 + i * 0.5) * s.padding
        )
      })

      c.textAlign = 'right'
      c.translate(-(canvas.width / 2), 0)

      rightSubheaders.forEach((line, i) => {
        c.fillStyle = colorCode(0x7).hex
        drawFormattedText(
          c,
          line,
          width - s.padding,
          s.headerHeight + (i + 1) * s.subheaderHeight + (2 + i * 0.5) * s.padding,
          'right'
        )
      })
    })

    c.fillStyle = s.fgColor
    c.font = s.font(s.mainHeight)

    transaction(c, () => {
      c.translate(0, s.headerHeight + s.mainHeight + 6 * s.padding)

      Object.keys(rows).forEach((mode, i) => {
        const lineY = i * (s.mainHeight + s.padding * 2) + s.mainHeight + 2 * s.padding

        c.beginPath()
        c.moveTo(0, lineY)
        c.lineTo(width, lineY)
        c.stroke()

        c.fillText(
          mode,
          s.padding,
          i * (s.mainHeight + s.padding * 2) + 2.5 * s.padding + 2 * s.mainHeight
        )
      })

      c.translate(width, 0)

      Object.keys(columns)
        .map((col, i) => [col, i] as const)
        .reverse()
        .reduce((prevX, [col, i]) => {
          const x = prevX - s.padding

          c.beginPath()
          c.moveTo(x - statColumnWidths[i] - s.padding, s.padding)
          c.lineTo(x - statColumnWidths[i] - s.padding, height - c.getTransform().f)
          c.stroke()

          transaction(c, () => {
            c.textAlign = 'right'
            c.translate(-(canvas.width / 2), 0)

            c.fillText(col, x, s.mainHeight + s.padding)
            Object.keys(rows).forEach((mode, j) => {
              const value = stats[mode][col]

              c.fillText(
                value.toString(),
                x,
                j * (s.mainHeight + s.padding * 2) + 2.5 * s.padding + 2 * s.mainHeight
              )
            })
          })

          // c.translate(-(s.padding * 2 + statColumnWidths[i]), 0)
          return prevX - statColumnWidths[i] - s.padding * 2
        }, 0)
    })

    const buf = await canvas.encode('png')

    const response: StatsProviderResponse = {
      uuid: player.uuid,
      image: buf,
      metadata: {
        height,
        width,
        bytes: buf.byteLength,
        format: 'png',
      },
    }

    return response
  },
})

export default STATS_PROVIDER_BEDWARS

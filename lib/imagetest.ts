/* eslint-disable no-console */
import type { Player } from '@calico32/hypixel-types'
import { Image } from '@napi-rs/canvas'
import fs from 'node:fs'
import STATS_PROVIDER_BEDWARS from './commands/minecraft/_bedwars.js'
import { formatBytes } from './util/format.js'
import { resolvePath } from './util/path.js'

void (async () => {
  const player: Player = JSON.parse(
    (
      await fs.promises.readFile(resolvePath('data/player.json'), 'utf-8')
    ).toString()
  )

  const avatar = new Image(165, 165)
  avatar.src = await fs.promises.readFile(resolvePath('data/avatar.png'))

  const { image, metadata } = await STATS_PROVIDER_BEDWARS.makeStats(
    player,
    avatar
  )

  await fs.promises.writeFile(`${process.env.HOME}/imagetest.png`, image)
  console.log(
    `wrote image size:${metadata.width}x${metadata.height} bytes:${formatBytes(
      metadata.bytes
    )}`
  )
})()

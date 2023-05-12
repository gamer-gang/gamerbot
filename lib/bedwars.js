/* eslint-disable no-console */
import { GlobalFonts, Image } from '@napi-rs/canvas'
import dotenv from 'dotenv'
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import util from 'node:util'
import bedwars from '../src/commands/minecraft/_bedwars.js'

const AVATAR_SIZE = 165

GlobalFonts.registerFromPath('assets/RobotoMono-Regular-NF.ttf')

const username = 'wiisportsresorts'

let player

const statsFile = `test/${username}.json`
const avatarFile = `test/${username}.png`

if (existsSync(statsFile)) {
  player = JSON.parse(await fs.readFile(statsFile, 'utf8'))
} else {
  dotenv.config()

  const url = process.env.HYPIXEL_CACHE_URL
  const secret = process.env.HYPIXEL_CACHE_SECRET

  if (!url || !secret) {
    throw new Error('missing hypixel-cache url or secret')
  }

  /** @type {import('hypixel-cache').HypixelCacheResponse} */
  const response = await fetch(`${url}/name/${username}`, {
    headers: { 'X-Secret': secret },
  }).then((r) => r.json())

  if (!response.success) {
    throw new Error(response.error)
  }

  await fs.writeFile(statsFile, JSON.stringify(response.player), 'utf8')

  player = response.player
}

const avatar = new Image(AVATAR_SIZE, AVATAR_SIZE)

if (existsSync(avatarFile)) {
  avatar.src = await fs.readFile(avatarFile)
} else {
  const avatarResponse = await fetch(
    `https://crafatar.com/avatars/${player.uuid}?size=${AVATAR_SIZE}&overlay`
  )

  const avatarData = Buffer.from(await avatarResponse.arrayBuffer())

  await fs.writeFile(avatarFile, avatarData, 'utf8')

  avatar.src = avatarData
}

const { image, metadata } = await bedwars.makeStats(player, avatar)

console.log(util.inspect(metadata, { depth: null }))

fs.writeFile('test/bedwars.png', image)

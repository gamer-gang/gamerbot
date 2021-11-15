import { Message, PartialMessage, User } from 'discord.js'
import yaml from 'js-yaml'
import _ from 'lodash'
import assert from 'node:assert'
import fs from 'node:fs'
import { GamerbotClient } from './GamerbotClient.js'
import { prisma } from './prisma.js'
import { resolvePath } from './util/path.js'

const eggfile = yaml.load(fs.readFileSync(resolvePath('assets/egg.yaml')).toString('utf-8'))
if (typeof eggfile !== 'object') throw new Error('egg.yaml must be object')

const eggs = _.uniq((eggfile as { eggs?: string[] }).eggs?.map((egg) => egg.toLowerCase()))
if (eggs?.length === 0) throw new Error('no eggs specified in assets/egg.yaml')

export const hasEggs = (msg: Message | PartialMessage): boolean =>
  eggs.some((egg) => msg.content?.toLowerCase().includes(egg))

const cooldown = 30000

class EggCooldown {
  constructor(public timestamp: number, public warned = false) {}

  expired(): boolean {
    return Date.now() > this.timestamp + cooldown
  }
}

const getEggTotalFromDatabase = async (): Promise<bigint> => {
  const result = await prisma.$queryRaw`SELECT SUM(collected) FROM "EggLeaderboard";`

  assert(Array.isArray(result) && result.length === 1, 'result must be array of length 1')

  const sum = result[0].sum ?? '0'

  return BigInt(sum)
}

let eggCount: bigint

const assertDatabaseEntry = async (user: User): Promise<void> => {
  const userId = user.id

  const existing = await prisma.eggLeaderboard.findFirst({ where: { userId } })

  if (existing != null) return

  await prisma.eggLeaderboard.create({ data: { userId, userTag: user.tag } })
}

export const getTotal = async (): Promise<BigInt> => {
  if (eggCount != null) {
    const count = await getEggTotalFromDatabase()
    eggCount ??= count
    return eggCount
  }

  return eggCount
}

const grantEgg = async (client: GamerbotClient, msg: Message | PartialMessage): Promise<void> => {
  assert(msg.author, 'Message has no author')

  const userId = msg.author.id

  void msg.react('🥚')
  eggCount++
  void client.refreshPresence()

  await assertDatabaseEntry(msg.author)

  const existing = await prisma.eggLeaderboard.findFirst({ where: { userId } })

  assert(existing, 'existing EggLeaderboard entry must exist')

  await prisma.eggLeaderboard.update({
    where: { userId },
    data: {
      collected: existing.collected + 1n,
      balance: existing.balance + 1n,
      userTag: msg.author.tag,
    },
  })
}

const cooldowns: Record<string, EggCooldown> = {}

export const onMessage = async (
  client: GamerbotClient,
  message: Message | PartialMessage
): Promise<void> => {
  if (message.channel.type === 'DM') return

  if (!hasEggs(message)) return

  // react egg for webhooks and bots, but don't grant
  if (
    message.author?.tag.endsWith('#0000') === true ||
    message.author?.bot === true ||
    message.webhookId != null
  ) {
    void message.react('🥚')
    return
  }

  if (cooldowns[message.author?.id as string] != null) {
    const cooldown = cooldowns[message.author?.id as string]
    if (!cooldown.expired() && !cooldown.warned) {
      cooldown.warned = true
      void message.react('❄️')
      return
    }

    if (!cooldown.expired()) return
  }

  cooldowns[message.author?.id as string] = new EggCooldown(Date.now())
  void grantEgg(client, message)
}

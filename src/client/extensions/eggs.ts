import { ActivityType, ChannelType, Message, PartialMessage, User } from 'discord.js'
import yaml from 'js-yaml'
import _ from 'lodash'
import assert from 'node:assert'
import fs from 'node:fs'
import { prisma } from '../../prisma.js'
import { resolvePath } from '../../util/path.js'
import { GamerbotClient } from '../GamerbotClient.js'
import { ClientExtension } from './_extension.js'

const eggs = loadEggFile()

const EGG_COOLDOWN = 30000

const hasEggs = (msg: Message | PartialMessage): boolean =>
  eggs.some((egg) => msg.content?.toLowerCase().includes(egg))

class EggsCooldown {
  constructor(public timestamp: number, public warned = false) {}

  get expired(): boolean {
    return Date.now() > this.timestamp + EGG_COOLDOWN
  }
}

export default class EggExtension extends ClientExtension {
  total!: bigint
  cooldowns = new Map<string, EggsCooldown>()

  constructor(client: GamerbotClient) {
    super(client, 'egg')
  }

  async onReady(): Promise<void> {
    this.total = await this.getTotal()
    this.refreshPresence()
  }

  async onMessageCreate(message: Message): Promise<void> {
    if (message.channel.type === ChannelType.DM) return
    if (message.guild == null) return

    const config = await prisma.config.findFirst({
      where: { guildId: message.guild.id },
      select: { egg: true },
    })
    if (config == null || !config.egg) return

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

    const cooldown = this.cooldowns.get(message.author?.id as string)
    if (cooldown != null) {
      if (!cooldown.expired && !cooldown.warned) {
        cooldown.warned = true
        void message.react('❄️')
        return
      }

      if (!cooldown.expired) return
    }

    this.cooldowns.set(message.author?.id as string, new EggsCooldown(Date.now()))
    void this.grantEgg(message)
  }

  async getTotal(): Promise<bigint> {
    if (this.total == null) {
      const count = await this.getEggTotalFromDatabase()
      this.total ??= count
      return this.total
    }

    return this.total
  }

  async getEggTotalFromDatabase(): Promise<bigint> {
    assert(prisma.eggLeaderboard, 'prisma.eggLeaderboard must exist')
    const result = await prisma.$queryRaw`SELECT SUM(collected) FROM "EggLeaderboard";`

    assert(Array.isArray(result) && result.length === 1, 'result must be array of length 1')

    const sum = result[0].sum ?? '0'

    return BigInt(sum)
  }

  async grantEgg(msg: Message | PartialMessage): Promise<void> {
    assert(msg.author, 'Message has no author')

    const userId = msg.author.id

    void msg.react('🥚')
    this.total++
    void this.refreshPresence()

    await this.assertDatabaseEntry(msg.author)

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

  async refreshPresence(): Promise<void> {
    const num = await this.getTotal()
    this.client.ext.presence.presence = {
      activities: [
        {
          type: ActivityType.Playing,
          name: `with ${num.toLocaleString()} egg${num === 1n ? '' : 's'} | /help`,
        },
      ],
    }
  }

  async assertDatabaseEntry(user: User): Promise<void> {
    const userId = user.id

    const existing = await prisma.eggLeaderboard.findFirst({ where: { userId } })

    if (existing != null) return

    await prisma.eggLeaderboard.create({ data: { userId, userTag: user.tag } })
  }
}

function loadEggFile() {
  const eggfile = yaml.load(fs.readFileSync(resolvePath('assets/egg.yaml')).toString('utf-8'))
  if (typeof eggfile !== 'object') throw new Error('egg.yaml must be object')

  const eggs = _.uniq((eggfile as { eggs?: string[] }).eggs?.map((egg) => egg.toLowerCase()))
  if (eggs?.length === 0) throw new Error('no eggs specified in assets/egg.yaml')
  return eggs
}

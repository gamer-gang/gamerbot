import {
  ActionRowBuilder,
  ActivityType,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Message,
  PartialMessage,
  User,
} from 'discord.js'
import yaml from 'js-yaml'
import _ from 'lodash'
import assert from 'node:assert'
import fs from 'node:fs'
import { prisma } from '../../prisma.js'
import { resolvePath } from '../../util/path.js'
import { Embed } from '../../util/embed.js'
import { GamerbotClient } from '../GamerbotClient.js'
import { ClientExtension } from './_extension.js'

const eggs = loadEggFile()

const EGG_COOLDOWN = 30//_000
const EGG_MAX_STREAK = 3//2
const EGG_PUNISHMENT_FACTOR = 16

const EGG_STREAK_LIFETIME = 300_000

const hasEggs = (msg: Message | PartialMessage): boolean =>
  eggs.some((egg) => msg.content?.toLowerCase().includes(egg))

class EggsCooldown {
  constructor(public timestamp: number, public warned = false) {}

  get expired(): boolean {
    return Date.now() > this.timestamp + EGG_COOLDOWN
  }
}

class EggsStreak {
  constructor(public timestamp: number, public streak = 0) {}

  get expired(): boolean {
    return Date.now() > this.timestamp + EGG_STREAK_LIFETIME
  }
}

export default class EggExtension extends ClientExtension {
  total!: bigint
  cooldowns = new Map<string, EggsCooldown>()
  streaks = new Map<string, EggsStreak>()

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

    const authorId = message.author.id

    const cooldown = this.cooldowns.get(authorId)
    if (cooldown != null) {
      if (!cooldown.expired && !cooldown.warned) {
        cooldown.warned = true
        void message.react('❄️')
        return
      }

      if (!cooldown.expired) return
    }

    this.cooldowns.set(authorId, new EggsCooldown(Date.now()))

    const streak = this.streaks.get(authorId)
    if (!streak || streak.expired) {
      this.streaks.set(authorId, new EggsStreak(Date.now(), 1))
      void this.grantEgg(message)
      return
    }

    if (streak.streak >= EGG_MAX_STREAK) {
      this.streaks.set(authorId, new EggsStreak(Date.now(), 0))
      void this.sendCAPTCHA(message)
      return
    }

    this.streaks.set(authorId, new EggsStreak(Date.now(), streak.streak + 1))
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

  async sendCAPTCHA(msg: Message | PartialMessage): Promise<void> {
    assert(msg.author, 'Message has no author')

    const userId = msg.author.id

    const emojis = _.shuffle(['🥚', '🐀', '💀'])

    const captcha = await msg.reply({
      content: msg.author.toString(),
      embeds: [
        new Embed({
          title: `Egg CAPTCHA`,
          description: `Are you there? Click the egg button in order to continue receiving eggs.`,
        }),
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          ...emojis.map(
            (emoji) =>
              new ButtonBuilder({
                customId: emoji,
                style: ButtonStyle.Primary,
                emoji,
              })
          )
        ),
      ],
    })

    try {
      const response = await captcha.awaitMessageComponent({
        filter: (i) => i.user.id === userId,
        time: 30_000,
      })

      if (response.customId == '🥚') {
        void captcha.delete()
        void this.grantEgg(msg)
      } else {
        throw 'bruh' // best practices?
      }
    } catch (e) {
      // sorta hacky but cry about it
      this.cooldowns.set(
        userId,
        new EggsCooldown(Date.now() + EGG_COOLDOWN * (EGG_PUNISHMENT_FACTOR - 1))
      )

      captcha.edit({
        embeds: [
          Embed.error(
            `Epic CAPTCHA fail... Egg privileges revoked for ${
              (EGG_COOLDOWN * EGG_PUNISHMENT_FACTOR) / 1000 / 60
            } minutes.`
          ),
        ],
        components: [],
      })
    }
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

import {
  APIEmbed,
  APIEmbedAuthor,
  APIEmbedFooter,
  APIEmbedProvider,
  EmbedBuilder,
  EmbedData,
  User,
} from 'discord.js'
import { GamerbotClient } from '../client/GamerbotClient.js'
import { Color } from './color.js'
import { getProfileImageUrl } from './discord.js'
import { formatErrorMessage } from './format.js'

type EmbedIntent = 'info' | 'success' | 'warning' | 'error'

export interface EmbedOptions {
  noColor?: boolean
  noAuthor?: boolean
  intent?: EmbedIntent
}

const intentText = (message: string, desc?: string): string =>
  `${message}${desc != null ? `\n\n${desc}` : ''}`

const spacer = '  \u2002'

export const COLORS = {
  // green: Color.from(0x8eef43),
  // blue: Color.from(0x209fd5),
  // red: Color.from(0xfb4b4e),
  // orange: Color.from(0xefa443),
  blue: Color.from('0284c7'),
  green: Color.from('16a34a'),
  red: Color.from('dc2626'),
  orange: Color.from('d97706'),
}

export class Embed extends EmbedBuilder {
  static #client: GamerbotClient | undefined
  static setClient(client: GamerbotClient): void {
    Embed.#client = client
  }
  static error(error: unknown): Embed
  static error(message: string, description?: string): Embed
  static error(err: unknown, description?: string): Embed {
    if (err instanceof Error || typeof err === 'object') {
      return Embed.error(formatErrorMessage(err))
    }

    return new Embed({
      intent: 'error',
      description: `${this.#client?.customEmojis.getString('error', '❌')}${spacer}${intentText(
        `${err}`,
        description
      )}`,
    })
  }

  static warning(message: string, description?: string): Embed {
    // const client = getClient();
    // customEmojis.warning ??= client.getCustomEmoji('warn') ?? false;
    return new Embed({
      intent: 'warning',
      description: `⚠️${spacer}${intentText(message, description)}`,
    })
  }

  static success(message: string, description?: string): Embed {
    // const client = getClient();
    // customEmojis.success ??= client.getCustomEmoji('success') ?? false;
    return new Embed({
      intent: 'success',
      description: `✅${spacer}${intentText(message, description)}`,
    })
  }

  static info(message: string, description?: string): Embed {
    return new Embed({
      intent: 'info',
      description: intentText(message, description),
    })
  }

  constructor(options?: (EmbedBuilder | EmbedData | APIEmbed) & EmbedOptions) {
    if (options instanceof EmbedBuilder) {
      super(options.data)
    } else {
      super(options)
    }

    if (this.data.color == null && options?.noColor !== true && options?.intent) {
      this.intent = options?.intent
    }
  }

  get title(): string | undefined {
    return this.data.title
  }

  set title(title: string | undefined) {
    this.setTitle(title ?? null)
  }

  get description(): string | undefined {
    return this.data.description
  }

  set description(description: string | undefined) {
    this.setDescription(description ?? null)
  }

  get url(): string | undefined {
    return this.data.url
  }

  set url(url: string | undefined) {
    this.setURL(url ?? null)
  }

  get timestamp(): Date | undefined {
    return this.data.timestamp ? new Date(this.data.timestamp) : undefined
  }

  set timestamp(timestamp: Date | undefined) {
    this.setTimestamp(timestamp ?? null)
  }

  get color(): number | undefined {
    return this.data.color
  }

  set color(color: number | undefined) {
    this.setColor(color ?? null)
  }

  get footer(): APIEmbedFooter | undefined {
    return this.data.footer
  }

  set footer(footer: APIEmbedFooter | undefined) {
    this.setFooter(footer ?? null)
  }

  get image(): string | undefined {
    return this.data.image?.url
  }

  set image(image: string | undefined) {
    this.setImage(image ?? null)
  }

  get video(): string | undefined {
    return this.data.video?.url
  }

  get provider(): APIEmbedProvider | undefined {
    return this.data.provider
  }

  get author(): APIEmbedAuthor | undefined {
    return this.data.author
  }

  set author(author: APIEmbedAuthor | undefined) {
    this.setAuthor(author ?? null)
  }

  get thumbnail(): string | undefined {
    return this.data.thumbnail?.url
  }

  set thumbnail(thumbnail: string | undefined) {
    this.setThumbnail(thumbnail ?? null)
  }

  addField(name: string, value: string, inline?: boolean): this {
    return super.addFields({ name, value, inline })
  }

  set intent(intent: EmbedIntent) {
    switch (intent) {
      case 'error':
        this.setColor(COLORS.red.number)
        break
      case 'warning':
        this.setColor(COLORS.orange.number)
        break
      case 'success':
        this.setColor(COLORS.green.number)
        break
      case 'info':
      default:
        this.setColor(COLORS.blue.number)
    }
  }

  static profileAuthor(user: User, name = user.username, url?: string): APIEmbedAuthor {
    return {
      name,
      icon_url: getProfileImageUrl(user),
      url,
    }
  }

  static profileThumbnail(user: User): string {
    return getProfileImageUrl(user)
  }
}

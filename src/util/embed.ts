import { MessageEmbed, MessageEmbedOptions, User } from 'discord.js'
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

export class Embed extends MessageEmbed {
  static error(error: unknown): Embed
  static error(message: string, description?: string): Embed
  static error(err: unknown, description?: string): Embed {
    if (err instanceof Error || typeof err === 'object') {
      return Embed.error(formatErrorMessage(err))
    }

    return new Embed({
      intent: 'error',
      description: `❌${spacer}${intentText(`${err}`, description)}`,
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

  constructor(options?: (MessageEmbed | MessageEmbedOptions) & EmbedOptions) {
    super(options)

    if (this.color == null && options?.noColor !== true && options?.intent) {
      this.setIntent(options?.intent)
    }
  }

  setIntent(intent: EmbedIntent): this {
    switch (intent) {
      case 'error':
        this.setColor(COLORS.red.asNumber)
        break
      case 'warning':
        this.setColor(COLORS.orange.asNumber)
        break
      case 'success':
        this.setColor(COLORS.green.asNumber)
        break
      case 'info':
      default:
        this.setColor(COLORS.blue.asNumber)
    }

    return this
  }

  setAuthorToProfile(name: string, user: User, url?: string): this {
    this.setAuthor({
      name,
      iconURL: getProfileImageUrl(user),
      url,
    })
    return this
  }

  setThumbnailToProfileImage(user: User): this {
    this.setThumbnail(getProfileImageUrl(user))
    return this
  }
}

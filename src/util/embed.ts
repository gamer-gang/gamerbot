import { MessageEmbed, MessageEmbedOptions } from 'discord.js'
import { Color } from './color.js'

type EmbedIntent = 'info' | 'success' | 'warning' | 'error'

export interface EmbedOptions {
  noColor?: boolean
  noAuthor?: boolean
  intent?: EmbedIntent
}

const intentText = (message: string, desc?: string): string =>
  `${message}${desc != null ? `\n\n${desc}` : ''}`

const spacer = '  \u2002'

export const colors = {
  green: Color.from(0x8eef43),
  blue: Color.from(0x209fd5),
  red: Color.from(0xfb4b4e),
  orange: Color.from(0xefa443),
}

export class Embed extends MessageEmbed {
  static error(message: string, description?: string): Embed {
    // const client = getClient();
    // customEmojis.error ??= client.getCustomEmoji('error') ?? false;
    return new Embed({
      intent: 'error',
      description: `❌${spacer}${intentText(message, description)}`,
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

    if (this.color == null && options?.noColor === false) {
      switch (options?.intent) {
        case 'error':
          this.setColor(colors.red.asNumber)
          break
        case 'warning':
          this.setColor(colors.orange.asNumber)
          break
        case 'success':
          this.setColor(colors.green.asNumber)
          break
        case 'info':
        default:
          this.setColor(colors.blue.asNumber)
      }
    }
  }
}

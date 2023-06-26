/* eslint-disable @typescript-eslint/no-unused-vars */
import { Channel, Guild, Message } from 'discord.js'
import env from '../../env.js'
import { Embed } from '../../util/embed.js'
import { GamerbotClient } from '../GamerbotClient.js'
import { ClientExtension } from './_extension.js'

export default class EvalExtension extends ClientExtension {
  constructor(client: GamerbotClient) {
    super(client, 'eval')
  }

  async onMessage(message: Message): Promise<void> {
    const allowedUsers = env.EVAL_ALLOWED_USERS?.split(',') ?? []
    if (!allowedUsers.includes(message.author!.id)) return

    const exec = new RegExp(`^\\$\\$${this.client.user.id}\\.eval ((?:.|\\n)+)$`).exec(
      message.content ?? ''
    )
    if (!exec) return
    const code = exec[1]
    try {
      const output = await this.execute(code, message)
      if (output.length > 2000) {
        // send as file
        message.reply({
          files: [
            {
              name: 'output.txt',
              attachment: Buffer.from(trimCodeFences(output)),
            },
          ],
        })
      } else if (output.length > 0) {
        // send as message
        message.reply(output)
      } else {
        message.react('✅')
      }
    } catch (err) {
      message.reply({
        embeds: [Embed.error(err)],
      })
    }
  }

  async execute(code: string, message?: Message): Promise<string> {
    let output = ''

    const print = (data: unknown): void => {
      if (message) {
        // in a discord context, pretty print objects
        const s = typeof data === 'object' ? codeBlock(JSON.stringify(data, null, 2)) : data
        output += s
      } else {
        // just stringify it
        const s = typeof data === 'object' ? JSON.stringify(data) : data
        output += s
      }
    }

    const println = (data: unknown): void => {
      print(data)
      output += '\n'
    }

    const codeBlock = (data: unknown, lang = ''): string => {
      const s = typeof data === 'object' ? JSON.stringify(data, null, 2) : data
      return `\`\`\`${lang}\n${s}\n\`\`\``
    }

    await execute(
      code,
      this.client,
      message?.channel,
      message?.guild,
      message,
      print,
      println,
      codeBlock
    )

    return output
  }
}

const execute = async (
  code: string,
  client: GamerbotClient,
  channel: Channel | undefined,
  guild: Guild | null | undefined,
  message: Message | undefined,
  print: (data: unknown) => void,
  println: (data: unknown) => void,
  codeBlock: (data: unknown, lang?: string) => string
): Promise<void> => {
  const ret = await new Function(
    'code',
    'client',
    'channel',
    'guild',
    'message',
    'print',
    'println',
    'codeBlock',
    `return async () => {${code}}`
  )(code, client, channel, guild, message, print, println, codeBlock)()

  if (ret) {
    print(ret)
  }
}

const trimCodeFences = (s: string): string => {
  if (s.startsWith('```')) {
    s = s.slice(3)
  }

  if (s.endsWith('```')) {
    s = s.slice(0, -3)
  }

  return s
}

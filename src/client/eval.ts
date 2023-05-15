/* eslint-disable @typescript-eslint/no-unused-vars */
import { Channel, Guild, Message, PartialMessage } from 'discord.js'
import env from '../env.js'
import { Embed } from '../util/embed.js'
import { GamerbotClient } from './GamerbotClient.js'

export const onMessage = async (
  client: GamerbotClient,
  message: Message | PartialMessage
): Promise<void> => {
  const allowedUsers = env.EVAL_ALLOWED_USERS?.split(',') ?? []
  if (!allowedUsers.includes(message.author!.id)) return

  const exec = new RegExp(`^\\$\\$${client.user.id}\\.eval ((?:.|\\n)+)$`).exec(
    message.content ?? ''
  )
  if (!exec) return

  const code = exec[1]

  let output = ''

  const print = (data: unknown): void => {
    const s = typeof data === 'object' ? codeBlock(JSON.stringify(data, null, 2)) : data
    output += s
  }

  const println = (data: unknown): void => {
    print(data)
    output += '\n'
  }

  const codeBlock = (data: unknown, lang = ''): string => {
    const s = typeof data === 'object' ? JSON.stringify(data, null, 2) : data
    return `\`\`\`${lang}\n${s}\n\`\`\``
  }

  try {
    await execute(code, client, message.channel, message.guild, message, print, println, codeBlock)

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

const execute = async (
  code: string,
  client: GamerbotClient,
  channel: Channel,
  guild: Guild | null,
  message: Message | PartialMessage,
  print: (data: unknown) => void,
  println: (data: unknown) => void,
  codeBlock: (data: unknown, lang?: string) => string
): Promise<void> => {
  const ret = new Function(
    'code',
    'client',
    'channel',
    'guild',
    'message',
    'print',
    'codeBlock',
    code
  )(code, client, channel, guild, message, print, println, codeBlock)

  if (ret) {
    const s = typeof ret === 'object' ? JSON.stringify(ret, null, 2) : ret
    print(`*returned:*\n${codeBlock(s)}`)
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

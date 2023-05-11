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

  const print = (str: string): void => {
    output += str
  }

  const println = (str: string): void => {
    output += str
    output += '\n'
  }

  const codeBlock = (str: string, lang = ''): string => {
    return `\`\`\`${lang}\n${str}\n\`\`\``
  }

  try {
    await execute(code, client, message.channel, message.guild, message, print, println, codeBlock)

    if (output.length > 2000) {
      // send as file
      message.reply({
        files: [
          {
            name: 'output.txt',
            attachment: Buffer.from(output),
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
  print: (str: string) => void,
  println: (str: string) => void,
  codeBlock: (str: string, lang?: string) => string
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

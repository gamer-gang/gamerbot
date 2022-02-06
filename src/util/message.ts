import { APIMessage } from 'discord-api-types/v9.js'
import { Formatters, MessageOptions } from 'discord.js'
import { IS_DEVELOPMENT } from '../constants.js'
import { Embed, EmbedOptions } from './embed.js'

export const parseDiscordJson = (json: string): MessageOptions => {
  const data = JSON.parse(json) as APIMessage

  if (data == null) throw new Error('Empty message')

  let embed: Embed | undefined

  if (data.embeds?.length !== 0) {
    if (data.embeds?.length > 1) throw new Error('Max 1 embed')

    const embedData = data.embeds[0] as EmbedOptions

    embed = new Embed(embedData)
  }

  return {
    content: data.content,
    embeds: embed != null ? [embed] : undefined,
  }
}

export const formatErrorMessage = (err: unknown): string => {
  if (IS_DEVELOPMENT) {
    if (err instanceof Error) {
      return `**${err.name}**: **${err.message}**\n\n${Formatters.codeBlock(
        err.stack ?? '(no stack)'
      )}`
    }
    return Formatters.codeBlock(`${err}`)
  }

  if (err instanceof Error) {
    return `**${err.name}**: ${err.message}`
  }

  return `${err}`
}

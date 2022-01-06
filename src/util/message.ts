import { APIMessage } from 'discord-api-types/v9.js'
import { MessageOptions } from 'discord.js'
import { Embed, EmbedOptions } from './embed.js'

export const parseDiscohookJSON = (json: string): MessageOptions => {
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

export const findErrorMessage = (err: unknown): string => {
  if (process.env.NODE_ENV === 'development') {
    if (err instanceof Error) {
      return `${err.message}\n\n${err.stack}`
    }
    return `${err}`
  }

  if (err instanceof Error) {
    return err.message
  }

  return `${err}`
}

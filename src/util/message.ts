import type { APIMessage } from 'discord-api-types/v9.js'
import { MessageCreateOptions } from 'discord.js'
import { Embed, EmbedOptions } from './embed.js'

export const parseDiscordJson = (json: string): MessageCreateOptions => {
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

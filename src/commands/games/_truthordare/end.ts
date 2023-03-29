import { CommandResult } from '../../command.js'
import { CommandContext } from '../../context.js'

export const truthOrDareEnd = async (context: CommandContext): Promise<CommandResult> => {
  // const { channel, client } = context
  // assert(channel?.type === ChannelType.GuildText)

  // const game = client.tod.get(channel.guild.id)
  // if (!game) {
  //   await channel.send({ embeds: [Embed.error('There is no game running in this server.')] })
  // }

  // await game.end()

  return CommandResult.Success
}

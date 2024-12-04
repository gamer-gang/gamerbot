import { ApplicationCommandType } from 'discord.js'
import { getProfileImageUrl } from '../../util/discord.js'
import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'

const COMMAND_GETAVATAR = command(ApplicationCommandType.User, {
  name: 'Get avatar',
  description: 'Get the avatar of a user.',

  async run(context) {
    const { interaction } = context

    const user = context.targetUser
    const icon = getProfileImageUrl(user)

    const embed = new Embed({
      author: {
        iconURL: icon ?? undefined,
        name: user.tag,
      },
      title: 'Avatar',
      image: { url: icon },
    })

    await interaction.reply({ embeds: [embed], ephemeral: true })
    return CommandResult.Success
  },
})

export default COMMAND_GETAVATAR

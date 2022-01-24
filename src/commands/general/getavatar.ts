import { getProfileImageUrl } from '../../util/discord.js'
import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'

const COMMAND_GETAVATAR = command('USER', {
  name: 'Get avatar',

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

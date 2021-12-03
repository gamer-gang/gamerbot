import { getProfileImageUrl } from '../../util/discord.js'
import { Embed } from '../../util/embed.js'
import command from '../command.js'

const COMMAND_AVATAR = command('CHAT_INPUT', {
  name: 'avatar',
  description: 'Show avatar for a user.',
  options: [
    {
      name: 'user',
      description: 'User to show avatar for',
      type: 'USER',
    },
  ],

  async run(context) {
    const { interaction, options } = context

    const user = options.getUser('user') ?? interaction.user
    const icon = getProfileImageUrl(user)

    const embed = new Embed({
      author: {
        iconURL: icon ?? undefined,
        name: user.tag,
      },
      title: 'Avatar',
      image: { url: icon },
    })

    await interaction.reply({ embeds: [embed] })
  },
})

export default COMMAND_AVATAR

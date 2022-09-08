import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js'
import { getProfileImageUrl } from '../../util/discord.js'
import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'

const COMMAND_AVATAR = command(ApplicationCommandType.ChatInput, {
  name: 'avatar',
  description: 'Show avatar for a user.',
  options: [
    {
      name: 'user',
      description: 'User to show avatar for.',
      type: ApplicationCommandOptionType.User,
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
    return CommandResult.Success
  },
})

export default COMMAND_AVATAR

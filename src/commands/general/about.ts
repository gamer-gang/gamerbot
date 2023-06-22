import { stripIndent } from 'common-tags'
import { ApplicationCommandType } from 'discord.js'
import packageJson from '../../../package.json'
import env from '../../env.js'
import { getProfileImageUrl } from '../../util/discord.js'
import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'

const COMMAND_ABOUT = command(ApplicationCommandType.ChatInput, {
  name: 'about',
  description: 'Show info about the bot.',

  async run(context) {
    const { interaction, client } = context

    await interaction.deferReply()

    const [guilds, users] = await Promise.all([
      client.ext.counts.countGuilds(),
      client.ext.counts.countUsers(),
    ])

    const embed = new Embed({
      title: 'About',
      author: Embed.profileAuthor(client.user),
      description: stripIndent`
        The general purpose bot that sometimes works™.

        **Website**: https://gamerbot.dev
        **Invite**: https://gamerbot.dev/invite
        **Repository**: [GitHub](https://github.com/gamer-gang/gamerbot)
        **Bug Reports/Feedback**: [GitHub Issues](https://github.com/gamer-gang/gamerbot/issues)
        **Support**: [Discord](${env.SUPPORT_SERVER_INVITE})
      `,
      thumbnail: {
        url: getProfileImageUrl(client.user),
      },
    })

    embed
      .addField('Servers', guilds.toLocaleString(), true)
      .addField('Users', users.toLocaleString(), true)
      .addField(
        'Version',
        globalThis.SENTRY_RELEASE || globalThis.GAMERBOT_VERSION || packageJson.version,
        true
      )

    await interaction.editReply({ embeds: [embed] })

    return CommandResult.Success
  },
})

export default COMMAND_ABOUT

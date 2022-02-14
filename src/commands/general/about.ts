import packageJson from '../../../package.json'
import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'

const COMMAND_ABOUT = command('CHAT_INPUT', {
  name: 'about',
  description: 'Show info about the bot.',

  async run(context) {
    const { interaction, client } = context

    const embed = new Embed({ title: 'About' })

    const [guilds, users] = await Promise.all([client.countGuilds(), client.countUsers()])

    embed
      .setAuthorToProfile(client.user.username, client.user)
      .addField('Repository', '[GitHub](https://github.com/gamer-gang/gamerbot)')
      .addField('Issues', '[Issues](https://github.com/gamer-gang/gamerbot/issues)')
      .addField('Servers', guilds.toLocaleString(), true)
      .addField('Users', users.toLocaleString(), true)
      .addField('Version', packageJson.version, true)

    await interaction.reply({ embeds: [embed] })

    return CommandResult.Success
  },
})

export default COMMAND_ABOUT

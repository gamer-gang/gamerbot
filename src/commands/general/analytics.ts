// import { ApplicationCommandType } from 'discord.js'
// import { DateTime } from 'luxon'
// import { Embed } from '../../util/embed.js'
// import command, { CommandResult } from '../command.js'

// const COMMAND_ANALYTICS = command(ApplicationCommandType.ChatInput, {
//   name: 'analytics',
//   description: 'View analytics for the current month.',

//   async run(context) {
//     const { interaction, client } = context
//     const { report } = client

//     const dateTime = DateTime.fromJSDate(report.month, { zone: 'utc' })

//     const embed = new Embed({
//       title: `Analytics: ${dateTime.monthLong} ${dateTime.year}`,
//     })

//     embed.thumbnail = Embed.profileThumbnail(client.user)

//     const [guilds, users] = await Promise.all([client.countGuilds(), client.countUsers()])

//     embed
//       .addField('Guilds', guilds.toLocaleString(), true)
//       .addField('Users', users.toLocaleString(), true)

//     embed
//       .addField('Bot Logins', report.botLogins.toLocaleString(), true)
//       .addField('Commands Sent', report.commandsSent.toLocaleString(), true)
//       .addField('Successful Commands', report.commandsSuccessful.toLocaleString(), true)
//       .addField('Failed Commands', report.commandsFailed.toLocaleString(), true)
//       .addField('Users Interacted', new Set(report.usersInteracted).size.toLocaleString(), true)

//     await interaction.reply({ embeds: [embed] })

//     return CommandResult.Success
//   },
// })

// export default COMMAND_ANALYTICS

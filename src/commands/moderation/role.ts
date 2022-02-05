import { MessageActionRow, MessageButton } from 'discord.js'
import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'

const COMMAND_ROLE = command('CHAT_INPUT', {
  name: 'role',
  description: 'amongus????? (like the imposter)',
  guildOnly: true,
  logUsage: true,
  options: [
    {
      name: 'role',
      description: 'Role to use',
      type: 'ROLE',
      required: true,
    },
  ],

  async run(context) {
    const { interaction, options } = context

    const role = options.getRole('role')
    if (!role) {
      await interaction.reply({
        embeds: [Embed.error('Invalid role')],
      })
      return CommandResult.Success
    }

    await interaction.reply({
      content: `Click the button for role \`${role.name}\``,
      components: [
        new MessageActionRow({
          components: [
            new MessageButton({
              customId: `getRole:${role.id}`,
              label: 'Get role',
              style: 'SUCCESS',
              // emoji: '✅',
            }),
            new MessageButton({
              customId: `removeRole:${role.id}`,
              label: 'Remove role',
              style: 'DANGER',
              // emoji: '❎',
            }),
          ],
        }),
      ],
    })

    return CommandResult.Success
  },
})

export default COMMAND_ROLE

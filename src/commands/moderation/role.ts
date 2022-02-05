import { Formatters, MessageActionRow, MessageButton, Role } from 'discord.js'
import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'

const COMMAND_ROLE = command('CHAT_INPUT', {
  name: 'role',
  description: 'Create a role distributor.',
  guildOnly: true,
  logUsage: true,
  botPermissions: ['MANAGE_ROLES'],
  userPermissions: ['MANAGE_ROLES'],
  options: [
    {
      name: 'role1',
      description: 'Role to use.',
      type: 'ROLE',
      required: true,
    },
    {
      name: 'role2',
      description: 'Role to use, #2.',
      type: 'ROLE',
    },
    {
      name: 'role3',
      description: 'Role to use, #3.',
      type: 'ROLE',
    },
    {
      name: 'role4',
      description: 'Role to use, #4.',
      type: 'ROLE',
    },
    {
      name: 'role5',
      description: 'Role to use, #5.',
      type: 'ROLE',
    },
  ],

  async run(context) {
    const { interaction, options } = context

    const invalidRoles = [
      interaction.guild.roles.everyone.id,
      interaction.guild.roles.premiumSubscriberRole?.id,
    ]

    const userHighest = interaction.member.roles.highest
    const isAdmin = interaction.member.permissions.has('ADMINISTRATOR')

    const roles: Role[] = []

    for (const index of [1, 2, 3, 4, 5]) {
      const roleInput = options.getRole(`role${index}`)

      if (!roleInput) continue

      const role = interaction.guild.roles.resolve(roleInput.id)

      if (!role || invalidRoles.includes(role.id)) {
        await interaction.reply({
          embeds: [Embed.error(`\`role${index}\`: Invalid role.`)],
          ephemeral: true,
        })
        return CommandResult.Success
      }

      if (!isAdmin && role.comparePositionTo(userHighest) >= 0) {
        await interaction.reply({
          embeds: [Embed.error(`\`role${index}\`: This role is higher than your highest.`)],
          ephemeral: true,
        })
      }

      if (roles.find((existing) => existing.id === role.id)) continue
      roles.push(role)
    }

    const components = roles.map(
      (role) =>
        new MessageActionRow({
          components: [
            new MessageButton({
              customId: `role-add_${role.id}`,
              label: `Get @${role.name}`,
              style: 'PRIMARY',
            }),
            new MessageButton({
              customId: `role-remove_${role.id}`,
              label: `Remove @${role.name}`,
              style: 'DANGER',
            }),
          ],
        })
    )

    await interaction.reply({
      embeds: [
        Embed.info(
          roles.length === 1
            ? `Click the button for ${Formatters.roleMention(roles[0].id)}.`
            : `Click the buttons for the following roles:\n${roles
                .map((role) => Formatters.roleMention(role.id))
                .join('\n')}`
        ),
      ],
      components,
    })

    return CommandResult.Success
  },
})

export default COMMAND_ROLE

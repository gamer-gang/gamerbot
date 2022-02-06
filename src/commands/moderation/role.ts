import { Formatters, MessageActionRow, MessageButton, Role } from 'discord.js'
import _ from 'lodash'
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
    ...Array(19)
      .fill(0)
      .map(
        (_, i) =>
          ({
            name: `role${i + 2}`,
            description: `Role to use, #${i + 2}.`,
            type: 'ROLE',
          } as const)
      ),
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

    for (const index of Array(20).keys()) {
      const roleInput = options.getRole(`role${index + 1}`)

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

    const components = _.chunk(roles, 5).map(
      (roles) =>
        new MessageActionRow({
          components: roles.map(
            (role) =>
              new MessageButton({
                customId: `role-toggle_${role.id}`,
                label: `Get/Remove @${role.name}`,
                style: 'PRIMARY',
              })
          ),
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

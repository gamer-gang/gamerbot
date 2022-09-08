import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ButtonBuilder,
  ButtonStyle,
  Role,
  roleMention,
} from 'discord.js'
import _ from 'lodash'
import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'

const COMMAND_ROLE = command(ApplicationCommandType.ChatInput, {
  name: 'role',
  description: 'Create a role distributor.',
  longDescription:
    'Create a role distributor that can be used to assign roles to users. A maximum of 20 roles can be used.',
  guildOnly: true,
  logUsage: true,
  userPermissions: ['ManageRoles'],
  botPermissions: ['ManageRoles'],
  examples: [
    {
      options: { role1: { mention: 'Role 1' }, role2: { mention: 'Role 2' } },
      description: 'Create a role distributor with two roles.',
    },
  ],
  options: [
    {
      name: 'role1',
      description: 'Role to use.',
      type: ApplicationCommandOptionType.Role,
      required: true,
    },
    ...Array(19)
      .fill(0)
      .map(
        (_, i) =>
          ({
            name: `role${i + 2}`,
            description: `Role to use, #${i + 2}.`,
            type: ApplicationCommandOptionType.Role,
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
    const isAdmin = interaction.member.permissions.has('Administrator')

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

    const components = _.chunk(roles, 5).map((roles) =>
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        roles.map(
          (role) =>
            new ButtonBuilder({
              customId: `role-toggle_${role.id}`,
              label: `@${role.name}`,
              style: ButtonStyle.Primary,
            })
        )
      )
    )

    await interaction.reply({
      embeds: [
        Embed.info(
          roles.length === 1
            ? `Click the button for ${roleMention(roles[0].id)}.`
            : `Click the buttons for the following roles:\n${roles
                .map((role) => roleMention(role.id))
                .join('\n')}`
        ),
      ],
      components,
    })

    return CommandResult.Success
  },
})

export default COMMAND_ROLE

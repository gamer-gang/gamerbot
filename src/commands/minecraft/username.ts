import { interactionReplySafe } from '../../util/discord.js'
import { Embed } from '../../util/embed.js'
import { usernameRegex, uuidRegex } from '../../util/regex.js'
import command, { CommandResult } from '../command.js'

const COMMAND_USERNAME = command('CHAT_INPUT', {
  name: 'username',
  description: 'Retrieve/modify your Minecraft username/UUID.',
  examples: [
    {
      options: { set: null, identifier: 'ConnorLinfoot' },
      description: 'Set your username to ConnorLinfoot.',
    },
    {
      options: { set: null, identifier: '12345678-1234-1234-1234-123456789012' },
      description: 'Set your UUID to 12345678-1234-1234-1234-123456789012.',
    },
    {
      options: { get: null },
      description: 'Get your username/UUID.',
    },
    {
      options: { get: null, user: { mention: 'Frog' } },
      description: "Get @Frog's username/UUID.",
    },
    {
      options: { clear: null },
      description: 'Clear your username/UUID.',
    },
  ],
  options: [
    {
      name: 'set',
      description: 'Set your Minecraft username/UUID.',
      type: 'SUB_COMMAND',
      options: [
        {
          name: 'identifier',
          description: 'The username/UUID to set.',
          type: 'STRING',
          required: true,
        },
      ],
    },
    {
      name: 'get',
      description: "Get a user's Minecraft username/UUID",
      type: 'SUB_COMMAND',
      options: [
        {
          name: 'user',
          description: 'The user to get the username/UUID of.',
          type: 'USER',
        },
      ],
    },
    {
      name: 'clear',
      description: 'Clear your Minecraft username/UUID.',
      type: 'SUB_COMMAND',
    },
  ],
  async run(context): Promise<CommandResult> {
    const { interaction, prisma, options, client } = context

    const subcommand = options.getSubcommand()

    try {
      if (subcommand === 'set') {
        const input = options.getString('identifier', true)

        if (!usernameRegex.test(input) && !uuidRegex.test(input)) {
          await interaction.reply({
            embeds: [Embed.error('Invalid username/UUID')],
            ephemeral: true,
          })
          return CommandResult.Success
        }

        await prisma.minecraftPlayer.upsert({
          where: {
            userId: interaction.user.id,
          },
          update: {
            minecraftIdentifier: input,
          },
          create: {
            userId: interaction.user.id,
            minecraftIdentifier: input,
          },
        })

        await interaction.reply({
          embeds: [Embed.success(`Set your username/UUID to **${input}**`)],
        })
        return CommandResult.Success
      } else if (subcommand === 'get') {
        const user = options.getUser('user')

        const userId = user?.id ?? interaction.user.id
        const userTag = user?.tag ?? interaction.user.tag

        const minecraftPlayer = await prisma.minecraftPlayer.findFirst({ where: { userId } })

        if (minecraftPlayer != null) {
          await interaction.reply({
            embeds: [
              Embed.info(
                `**${userTag}**'s username/UUID is **${minecraftPlayer?.minecraftIdentifier}**`
              ),
            ],
          })
        } else {
          await interaction.reply({ embeds: [Embed.info(`${userTag} has no username/UUID`)] })
        }

        return CommandResult.Success
      } else if (subcommand === 'clear') {
        await prisma.minecraftPlayer.delete({ where: { userId: interaction.user.id } })

        await interaction.reply({ embeds: [Embed.success('Cleared your Minecraft username/UUID')] })
        return CommandResult.Success
      }

      throw new Error(`Invalid subcommand ${subcommand}`)
    } catch (err) {
      client.getLogger('/username').error(err)
      await interactionReplySafe(interaction, { embeds: [Embed.error(err)] })
      return CommandResult.Failure
    }
  },
})

export default COMMAND_USERNAME

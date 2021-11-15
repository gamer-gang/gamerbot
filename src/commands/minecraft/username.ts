import { Embed } from '../../util/embed.js'
import { usernameRegex, uuidRegex } from '../../util/regex.js'
import command from '../command.js'

const COMMAND_USERNAME = command('CHAT_INPUT', {
  name: 'username',
  description: 'Retrieve/modify your Minecraft username/UUID',
  options: [
    {
      name: 'set',
      description: 'Set your Minecraft username/UUID',
      type: 'SUB_COMMAND',
      options: [
        {
          name: 'identifier',
          description: 'The username/UUID to set',
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
          description: 'The user to get the username/UUID of',
          type: 'USER',
        },
      ],
    },
    {
      name: 'clear',
      description: 'Clear your Minecraft username/UUID',
      type: 'SUB_COMMAND',
    },
  ],
  async run(context) {
    const { interaction, prisma } = context

    const subcommand = interaction.options.getSubcommand()

    try {
      if (subcommand === 'set') {
        const input = interaction.options.getString('identifier', true)

        if (!usernameRegex.test(input) && !uuidRegex.test(input)) {
          await interaction.reply({
            embeds: [Embed.error('Invalid username/UUID')],
            ephemeral: true,
          })
          return
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
      } else if (subcommand === 'get') {
        const user = interaction.options.getUser('user')

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
      } else if (subcommand === 'clear') {
        await prisma.minecraftPlayer.delete({ where: { userId: interaction.user.id } })

        await interaction.reply({ embeds: [Embed.success('Cleared your Minecraft username/UUID')] })
      }
    } catch (err) {
      await interaction.reply({ embeds: [Embed.error(err.message)] })
    }
  },
})

export default COMMAND_USERNAME

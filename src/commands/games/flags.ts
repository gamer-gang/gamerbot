import { ApplicationCommandType, ChannelType } from 'discord.js'
import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'

const COMMAND_FLAGS = command(ApplicationCommandType.ChatInput, {
  name: 'flags',
  description: 'Play a flag guessing game.',

  async run(context) {
    const {
      interaction,
      client: { flags },
    } = context

    if (interaction.channel?.type !== ChannelType.GuildText) {
      await interaction.reply({
        embeds: [Embed.error('This command can only be used in a server.')],
      })
      return CommandResult.Success
    }

    if (!interaction.member || !('guild' in interaction.member)) {
      await interaction.reply({
        embeds: [Embed.error('You must be in a server to use this command.')],
      })
      return CommandResult.Success
    }

    if (flags.get(interaction.channel.id)) {
      await interaction.reply({
        embeds: [Embed.error('A game is already in progress in this channel.')],
        ephemeral: true,
      })
      return CommandResult.Success
    }

    interaction.reply({
      embeds: [
        new Embed({
          title: 'Flags Game',
          description:
            'Type the name of the country whose flag is shown. Type `.stop` to end the game or `.skip` to skip the current round. The game will end after no one guesses correctly in 60 seconds. Good luck!',
        }),
      ],
    })

    const game = await flags.create(context, interaction.channel, interaction.member)

    await game.start()

    flags.delete(interaction.channel.id)

    return CommandResult.Success
  },
})

export default COMMAND_FLAGS

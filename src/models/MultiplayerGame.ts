import { AutocompleteInteraction, GuildMember, Interaction, TextChannel } from 'discord.js'
import { CommandContext } from '../commands/context.js'
import { Embed } from '../util/embed.js'

export abstract class MultiplayerGame {
  players: GuildMember[]

  constructor(
    private context: CommandContext,
    public channel: TextChannel,
    public creator: GuildMember
  ) {
    this.players = [creator]
  }

  get guild() {
    return this.creator.guild
  }

  abstract main(): Promise<void>

  async setup(): Promise<void> {
    return
  }

  async teardown(): Promise<void> {
    return
  }

  onError(err: Error): void {
    this.channel.send({ embeds: [Embed.error(err)] })
  }

  async start(): Promise<void> {
    try {
      await this.setup()
      await this.main()
    } catch (err) {
      this.onError(err)
    } finally {
      await this.teardown()
    }
  }

  get maxPlayers(): number {
    return 20
  }

  async join(interaction: Exclude<Interaction, AutocompleteInteraction>) {
    if (this.players.length >= this.maxPlayers) {
      await interaction.reply({
        embeds: [Embed.error('Game is full.')],
        ephemeral: true,
      })
      return
    }
    if (this.players.some((p) => p.id === interaction.user.id)) {
      await interaction.reply({
        embeds: [Embed.error('You are already in the game.')],
        ephemeral: true,
      })
      return
    }

    this.players.push(interaction.member as GuildMember)
    interaction.reply({ embeds: [Embed.success('Joined game.')], ephemeral: true })
  }

  async leave(interaction: Exclude<Interaction, AutocompleteInteraction>) {
    if (interaction.user.id === this.creator.id) {
      await interaction.reply({
        embeds: [Embed.error('You cannot leave the game you created.')],
        ephemeral: true,
      })
      return
    }
    if (!this.players.some((p) => p.id === interaction.user.id)) {
      await interaction.reply({
        embeds: [Embed.error('You are not in the game.')],
        ephemeral: true,
      })
      return
    }
    this.players = this.players.filter((p) => p.id !== interaction.user.id)
    interaction.reply({ embeds: [Embed.success('Left game.')], ephemeral: true })
  }
}

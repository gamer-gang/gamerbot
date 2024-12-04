import { ApplicationCommandType, AutocompleteInteraction } from 'discord.js'
import assert from 'node:assert'
import { ClientContext } from './ClientContext.js'
import type { GamerbotClient } from './GamerbotClient.js'

export default async function handleAutocomplete(
  this: GamerbotClient,
  ctx: ClientContext,
  interaction: AutocompleteInteraction
) {
  const command = this.commands.get(interaction.commandName)
  if (command == null) {
    await interaction.respond([{ name: 'Command not found.', value: 'command-not-found' }])
    return
  }

  assert(command.type === ApplicationCommandType.ChatInput, 'Command type must be ChatInput')

  const results = await command.autocomplete(interaction, this)

  if (results.length === 0) {
    await interaction.respond([{ name: 'No results found.', value: 'no-results-found' }])
    return
  }

  await interaction.respond(results)
  return
}

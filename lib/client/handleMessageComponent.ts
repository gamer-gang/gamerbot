import { MessageComponentInteraction } from 'discord.js'
import { sendUrban } from '../commands/messages/urban.js'
import { roleToggle } from '../commands/moderation/role.js'
import { KnownInteractions } from '../types.js'
import { ClientContext } from './ClientContext.js'
import type { GamerbotClient } from './GamerbotClient.js'

export default async function handleMessageComponent(
  this: GamerbotClient,
  ctx: ClientContext,
  interaction: MessageComponentInteraction
) {
  if (interaction.isButton()) {
    const [action] = interaction.customId.split('_')
    switch (action) {
      case KnownInteractions.Button.RoleToggle:
        return await roleToggle(interaction)
    }
    return
  }

  if (interaction.isStringSelectMenu()) {
    const id = interaction.customId
    if (id === KnownInteractions.StringSelect.UrbanDefine) {
      const term = interaction.values[0]
      sendUrban(interaction, term)
    }
    return
  }
}

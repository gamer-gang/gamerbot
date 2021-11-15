import { ApplicationCommandDataResolvable } from 'discord.js'
import dotenv from 'dotenv'
import { DEVELOPMENT } from './constants.js'
import { GamerbotClient } from './GamerbotClient.js'
import { isChatCommand } from './util.js'

dotenv.config()

const client = new GamerbotClient()

client.on('ready', () => {
  client.logger.info(`${client.user.tag} ready`)
  void client.refreshPresence()

  if (DEVELOPMENT) {
    if (process.env.DEVELOPMENT_GUILD_ID == null) {
      client.logger.error(
        'DEVELOPMENT_GUILD_ID environment variable not set, not deploying commands'
      )
      return
    }

    const guild = client.guilds.cache.get(process.env.DEVELOPMENT_GUILD_ID)

    if (guild == null) {
      client.logger.error(
        'DEVELOPMENT_GUILD_ID environment variable set but guild not found, not deploying commands'
      )
      return
    }

    const commands: ApplicationCommandDataResolvable[] = [...client.commands.values()].map(
      (command) => {
        return {
          type: command.type as never,
          name: command.name,
          description: isChatCommand(command) ? command.description : undefined,
          options: isChatCommand(command) ? command.options : undefined
        }
      }
    )

    void guild.commands.set(commands)
  }
})

void client.login(process.env.DISCORD_TOKEN)

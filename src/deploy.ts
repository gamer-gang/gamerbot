/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ApplicationCommandData,
  ApplicationCommandManager,
  ApplicationCommandType,
  Guild,
  GuildApplicationCommandManager,
} from 'discord.js'
import _ from 'lodash'
import assert from 'node:assert'
import type { GamerbotClient } from './client/GamerbotClient.js'
import { IS_DEVELOPMENT } from './constants.js'

export const deployCommands = async (client: GamerbotClient): Promise<void> => {
  let commandManager: GuildApplicationCommandManager | ApplicationCommandManager | undefined
  let guild: Guild | undefined

  const logger = client.getLogger('deploy')

  if (IS_DEVELOPMENT) {
    if (process.env.DEVELOPMENT_GUILD_ID == null) {
      logger.error('DEVELOPMENT_GUILD_ID environment variable not set, not deploying commands')
      return
    }

    guild = client.guilds.cache.get(process.env.DEVELOPMENT_GUILD_ID)

    if (guild == null) {
      logger.error(
        'DEVELOPMENT_GUILD_ID environment variable set but guild not found, not deploying commands'
      )
      return
    }

    commandManager = guild.commands
  } else {
    commandManager = client.application?.commands
  }

  if (commandManager == null) {
    logger.error('No command manager found, not deploying commands')
    return
  }

  const commands: ApplicationCommandData[] = [...client.commands.values()]
    .map((command) => ({
      type: command.type as never,
      name: command.name,
      description:
        command.type === ApplicationCommandType.ChatInput ? command.description ?? '' : '',
      options: (command as any).options ?? [],
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const existing = [...(await commandManager.fetch({})).values()]
    .map((c) => ({
      type: c.type,
      name: c.name,
      description: c.description,
      options: c.options,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  if (_.isEqual(commands, existing)) {
    if (IS_DEVELOPMENT) {
      assert(guild != null)
      logger.debug(`No commands to deploy to ${guild.name} (${guild.id})`)
    } else {
      logger.info('No commands to deploy to application')
    }
    return
  }

  await commandManager.set(commands)
  if (IS_DEVELOPMENT) {
    assert(guild != null)
    logger.debug(`${commands.length} commands deployed to ${guild.name} (${guild.id})`)
  } else {
    logger.info(`${commands.length} commands deployed globally`)
  }
}

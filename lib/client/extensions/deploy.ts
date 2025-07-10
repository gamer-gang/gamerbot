/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ApplicationCommandDataResolvable,
  ApplicationCommandManager,
  ApplicationCommandType,
  Guild,
  GuildApplicationCommandManager,
} from 'discord.js'
import _ from 'lodash'
import assert from 'node:assert'
import { Command } from '../../commands/command.js'
import env, { IS_DEVELOPMENT } from '../../env.js'
import type { GamerbotClient } from '../GamerbotClient.js'
import { ClientExtension } from './_extension.js'

export default class DeployExtension extends ClientExtension {
  constructor(client: GamerbotClient) {
    super(client, 'deploy')
  }

  async onReady(): Promise<void> {
    await this.deploy()
  }

  async deploy(): Promise<void> {
    let commandManager:
      | GuildApplicationCommandManager
      | ApplicationCommandManager
      | undefined
    let guild: Guild | undefined

    const entrypoint = this.client.commands
      .values()
      .filter((c) => c.type === (4 as any))
      .toArray()[0] as Command | undefined

    if (IS_DEVELOPMENT) {
      if (!env.DEVELOPMENT_GUILD_ID) {
        this.logger.error(
          'DEVELOPMENT_GUILD_ID environment variable not set, not deploying commands'
        )
        return
      }

      guild = this.client.guilds.cache.get(env.DEVELOPMENT_GUILD_ID)

      if (guild == null) {
        this.logger.error(
          'DEVELOPMENT_GUILD_ID environment variable set but guild not found, not deploying commands'
        )
        return
      }

      commandManager = guild.commands
      if (entrypoint) {
        this.client.application?.commands.set([entrypoint])
      }
    } else {
      commandManager = this.client.application?.commands
      for (const guild of this.client.guilds.cache.values()) {
        guild.commands.set([])
      }
    }

    if (commandManager == null) {
      this.logger.error('No command manager found, not deploying commands')
      return
    }

    let commands: NonNullable<ApplicationCommandDataResolvable>[] = [
      ...this.client.commands.values(),
    ].map((command) => ({
      type: command.type as never,
      name: command.name,
      description:
        command.type === ApplicationCommandType.ChatInput
          ? command.description ?? ''
          : '',
      options: (command as any).options ?? [],
    }))

    commands = _.sortBy(commands, 'name')

    let existing = [...(await commandManager.fetch({})).values()].map((c) => ({
      type: c.type,
      name: c.name,
      description: c.description,
      options: c.options,
    }))

    existing = _.sortBy(existing, 'name')

    if (_.isEqual(commands, existing)) {
      if (IS_DEVELOPMENT) {
        assert(guild != null)
        this.logger.debug(
          `No commands to deploy to ${guild.name} (${guild.id})`
        )
      } else {
        this.logger.info('No commands to deploy to application')
      }
      return
    }

    if (commandManager === this.client.application?.commands && entrypoint) {
      commands.push(entrypoint)
    }

    await commandManager.set(commands)
    if (IS_DEVELOPMENT) {
      assert(guild != null)
      this.logger.debug(
        `${commands.length} commands deployed to ${guild.name} (${guild.id})`
      )
    } else {
      this.logger.info(`${commands.length} commands deployed globally`)
    }
  }
}

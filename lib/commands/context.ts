import type { PrismaClient } from '@prisma/client'
import {
  ApplicationCommandType,
  BaseInteraction,
  ChatInputCommandInteraction,
  ContextMenuCommandInteraction,
  Message,
  MessageContextMenuCommandInteraction,
  User,
  UserContextMenuCommandInteraction,
} from 'discord.js'
import assert from 'node:assert'
import type { GamerbotClient } from '../client/GamerbotClient.js'

export class BaseContext<T extends BaseInteraction = BaseInteraction> {
  readonly client: GamerbotClient

  constructor(
    client: GamerbotClient,
    public readonly interaction: T,
    public readonly prisma: PrismaClient
  ) {
    this.client = client
  }

  get user(): T['user'] {
    return this.interaction.user
  }

  get member(): T['member'] {
    return this.interaction.member
  }

  get channel(): T['channel'] {
    return this.interaction.channel
  }

  get guild(): T['guild'] {
    return this.interaction.guild
  }

  get createdTimestamp(): T['createdTimestamp'] {
    return this.interaction.createdTimestamp
  }
}

export class CommandContext extends BaseContext<ChatInputCommandInteraction> {
  constructor(
    client: GamerbotClient,
    public readonly interaction: ChatInputCommandInteraction,
    prisma: PrismaClient
  ) {
    super(client, interaction, prisma)
  }

  get options(): ChatInputCommandInteraction['options'] {
    return this.interaction.options
  }
}

class ContextMenuCommandContext<T extends ContextMenuCommandInteraction> extends BaseContext<T> {
  constructor(client: GamerbotClient, public readonly interaction: T, prisma: PrismaClient) {
    super(client, interaction, prisma)
  }

  get options(): T['options'] {
    return this.interaction.options
  }
}

export class UserCommandContext extends ContextMenuCommandContext<UserContextMenuCommandInteraction> {
  get targetUser(): User {
    assert.equal(this.interaction.commandType, ApplicationCommandType.User)
    const user = this.client.users.cache.get(this.interaction.targetId)

    if (user == null) {
      throw new Error(`Could not resolve user ${this.interaction.targetId}`)
    }

    return user
  }
}

export class MessageCommandContext extends ContextMenuCommandContext<MessageContextMenuCommandInteraction> {
  get targetMessage(): Message {
    assert.equal(this.interaction.commandType, ApplicationCommandType.Message)

    if (this.channel == null) {
      throw new Error(`Could not resolve channel for message interaction ${this.interaction.id}.`)
    }

    const message = this.channel.messages.resolve(this.interaction.targetId)

    if (message == null) {
      throw new Error(`Could not resolve message ${this.interaction.targetId}`)
    }

    return message
  }
}

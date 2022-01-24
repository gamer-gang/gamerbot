import { PrismaClient } from '@prisma/client'
import { CommandInteraction, ContextMenuInteraction, Interaction, Message, User } from 'discord.js'
import assert from 'node:assert'
import { GamerbotClient } from '../GamerbotClient.js'

export class BaseContext {
  readonly client: GamerbotClient

  constructor(
    client: GamerbotClient,
    public readonly interaction: Interaction,
    public readonly prisma: PrismaClient
  ) {
    this.client = client
  }

  get user(): Interaction['user'] {
    return this.interaction.user
  }

  get member(): Interaction['member'] {
    return this.interaction.member
  }

  get channel(): Interaction['channel'] {
    return this.interaction.channel
  }

  get guild(): Interaction['guild'] {
    return this.interaction.guild
  }

  get createdTimestamp(): Interaction['createdTimestamp'] {
    return this.interaction.createdTimestamp
  }
}

export class CommandContext extends BaseContext {
  constructor(
    client: GamerbotClient,
    public readonly interaction: CommandInteraction,
    prisma: PrismaClient
  ) {
    super(client, interaction, prisma)
  }

  get options(): CommandInteraction['options'] {
    return this.interaction.options
  }
}

class ContextMenuCommandContext extends BaseContext {
  constructor(
    client: GamerbotClient,
    public readonly interaction: ContextMenuInteraction,
    prisma: PrismaClient
  ) {
    super(client, interaction, prisma)
  }

  get options(): ContextMenuInteraction['options'] {
    return this.interaction.options
  }
}

export class UserCommandContext extends ContextMenuCommandContext {
  get targetUser(): User {
    assert.equal(this.interaction.targetType, 'user')
    const user = this.client.users.cache.get(this.interaction.targetId)

    if (user == null) {
      throw new Error(`Could not resolve user ${this.interaction.targetId}`)
    }

    return user
  }
}

export class MessageCommandContext extends ContextMenuCommandContext {
  get targetMessage(): Message {
    assert.equal(this.interaction.targetType, 'message')

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

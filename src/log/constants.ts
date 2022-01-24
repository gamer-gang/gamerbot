import { ClientEvents } from 'discord.js'

// note: new events should be added to the end of this list, as the order is important
export const allowedEvents = [
  ...new Set<keyof ClientEvents>([
    'channelCreate',
    'channelDelete',
    'channelUpdate',

    'emojiCreate',
    'emojiDelete',
    'emojiUpdate',

    'guildBanAdd',
    'guildBanRemove',

    'guildIntegrationsUpdate',

    'guildMemberAdd',
    'guildMemberRemove',
    'guildMemberUpdate',

    'guildScheduledEventCreate',
    'guildScheduledEventDelete',
    'guildScheduledEventUpdate',

    'inviteCreate',
    'inviteDelete',

    'roleCreate',
    'roleDelete',
    'roleUpdate',

    'stageInstanceCreate',
    'stageInstanceDelete',
    'stageInstanceUpdate',

    'stickerCreate',
    'stickerDelete',
    'stickerUpdate',

    'threadCreate',
    'threadDelete',
    'threadUpdate',

    'userUpdate',
  ]),
]

export const eventsToBits = (events: ReadonlyArray<keyof ClientEvents>): bigint => {
  let bits = 0n
  for (const event of events) {
    const index = allowedEvents.indexOf(event)
    if (index === undefined) throw new Error(`Unknown event: ${event}`)
    bits |= 1n << BigInt(index)
  }
  return bits
}

export const bitsToEvents = (bits: bigint): ReadonlyArray<keyof ClientEvents> => {
  const events: Array<keyof ClientEvents> = []
  for (let i = 0; i < allowedEvents.length; i++) {
    if ((bits & (1n << BigInt(i))) !== 0n) {
      events.push(allowedEvents[i])
    }
  }
  return events
}

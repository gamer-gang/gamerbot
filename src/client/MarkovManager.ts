import Filter from 'bad-words'
import { ChannelType, Snowflake } from 'discord.js'
import emojiRegex from 'emoji-regex'
import { Logger } from 'log4js'
import { getDateFromSnowflake } from '../util/discord.js'
import { formatBytes } from '../util/format.js'
import { GamerbotClient } from './GamerbotClient.js'

interface MarkovGraph {
  timestamp: number
  words: {
    [startingWord: string]: {
      [nextWord: string]: number // weight
    }
  }
}

export class MarkovManager {
  #logger: Logger
  #format = formats.json

  constructor(public readonly client: GamerbotClient) {
    this.#logger = client.getLogger('markov')
  }

  graph: MarkovGraph = {
    timestamp: 0,
    words: {},
  }

  async load(): Promise<void> {
    this.#logger.debug('LOAD')

    const data = await this.client.storage.read<string>('markov')

    if (data) {
      this.graph = this.#format.deserialize(data)
    }

    let connections = 0
    for (const word of Object.values(this.graph.words)) {
      connections += Object.keys(word).length
    }

    this.#logger.debug(
      `LOAD done ${Object.keys(this.graph.words).length} words, ${connections} connections`
    )
  }

  async save(): Promise<void> {
    this.#logger.debug('SAVE')
    const data = this.#format.serialize(this.graph)
    await this.client.storage.write('markov', data)
    this.#logger.debug(`SAVE done ${formatBytes(data.length)}`)
  }

  addMessage(message: string): void {
    this.#logger.debug(`ADD message "${message}"`)

    const emoji = new RegExp(`^${emojiRegex().source}$`)
    // valid words are alphanumeric (no unicode) or emojis
    // strings of multiple emojis should be split into individual emojis
    let words: string[] = []
    for (const word of message.split(' ')) {
      const codePoints = [...word]
      let currentWord = ''

      for (let i = 0; i < codePoints.length; i++) {
        const c = codePoints[i]
        if (emoji.test(c)) {
          if (currentWord) words.push(currentWord)
          words.push(c)
          currentWord = ''
        } else if (/[a-z0-9]/i.test(c)) {
          // add to current word
          currentWord += c.toLowerCase()
        } else {
          // ignore
        }
      }

      if (currentWord) words.push(currentWord)
    }

    // filter bad words
    const filter = new Filter()
    words = words
      .filter((word) => !!word)
      .map((word) => (filter.isProfane(word) ? filter.replaceWord(word) : word))

    // add to graph
    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      const nextWord = words[i + 1]

      if (!nextWord) break

      if (!this.graph.words[word]) this.graph.words[word] = {}
      if (!this.graph.words[word][nextWord]) this.graph.words[word][nextWord] = 0
      this.graph.words[word][nextWord]++

      this.#logger.debug(`ADD edge ${word} -> ${nextWord}`)
    }
  }

  generateMessage(length = 10, seed?: string): string {
    const words = [seed ?? this.getRandomWord()]

    while (words.length < length) {
      const current = words[words.length - 1]
      const next = this.getNextWord(current)
      if (!next) break
      words.push(next)
    }

    return words.join(' ')
  }

  getRandomWord(): string {
    const words = Object.keys(this.graph.words)
    return words[Math.floor(Math.random() * words.length)]
  }

  getNextWord(word: string): string | undefined {
    const nextWords = this.graph.words[word]
    if (!nextWords) return undefined

    const totalWeight = Object.values(nextWords).reduce((a, b) => a + b, 0)
    const random = Math.random() * totalWeight
    let weight = 0

    for (const [nextWord, nextWeight] of Object.entries(nextWords)) {
      weight += nextWeight
      if (weight >= random) return nextWord
    }

    return undefined
  }

  /** read all messages newer than the last time the graph was updated and add them to the graph */
  async sync(): Promise<void> {
    const graphTimestamp = this.graph.timestamp

    this.#logger.debug(`SYNC start ${graphTimestamp}`)

    let messageCount = 0
    let latestTimestamp = 0

    for (const guild of this.client.guilds.cache.values()) {
      let guildMessageCount = 0

      this.#logger.debug(`SYNC guild ${guild.id} ${guild.name}`)
      for (const channel of guild.channels.cache.values()) {
        if (
          channel.type !== ChannelType.GuildText &&
          channel.type !== ChannelType.GuildAnnouncement &&
          channel.type !== ChannelType.GuildForum
        ) {
          continue
        }

        if (
          channel.lastMessageId &&
          getDateFromSnowflake(channel.lastMessageId).millisecond < graphTimestamp
        ) {
          this.#logger.debug(`SYNC channel ${channel.id} ${channel.name} skip`)
          continue
        }

        let channelMessageCount = 0

        this.#logger.debug(`SYNC channel ${channel.id} ${channel.name}`)

        let oldestMessage: Snowflake | undefined
        let oldestMessageTimestamp = Infinity

        while (oldestMessageTimestamp > graphTimestamp) {
          this.#logger.debug(
            `SYNC messages ${channel.id} ${channel.name} ${oldestMessage ?? 'latest'}`
          )
          const messages = await channel.messages.fetch({
            limit: 100,
            before: oldestMessage,
          })

          if (!messages.size) {
            this.#logger.debug(`SYNC messages break`)
            break
          }

          for (const message of messages.values()) {
            if (!oldestMessage || message.createdTimestamp < oldestMessageTimestamp) {
              oldestMessage = message.id
              oldestMessageTimestamp = message.createdTimestamp
            }

            if (message.author.bot) continue

            if (message.createdTimestamp <= graphTimestamp) continue
            this.addMessage(message.content)
            channelMessageCount++

            latestTimestamp = Math.max(latestTimestamp, message.createdTimestamp)
          }
        }

        this.#logger.debug(`SYNC channel done ${channelMessageCount}`)
        guildMessageCount += channelMessageCount
      }

      this.#logger.debug(`SYNC guild done ${guildMessageCount}`)
      messageCount += guildMessageCount
    }

    this.graph.timestamp = Math.max(this.graph.timestamp, latestTimestamp)

    this.#logger.debug(`SYNC done ${messageCount}`)
    await this.save()
  }
}

type MarkovFormats = {
  [format in 'json' | 'custom']: {
    serialize(graph: MarkovGraph): string
    deserialize(data: string): MarkovGraph
  }
}

const formats: MarkovFormats = {
  json: {
    serialize: (graph: MarkovGraph) => JSON.stringify(graph),
    deserialize: (data: string) => JSON.parse(data) as MarkovGraph,
  },
  custom: {
    serialize: (graph: MarkovGraph) => {
      const output = []
      output.push(`${graph.timestamp};`)
      for (const [startingWord, nextWords] of Object.entries(graph.words)) {
        output.push(`${startingWord},`)
        for (const [nextWord, count] of Object.entries(nextWords)) {
          output.push(`${nextWord}:${count},`)
        }
        output.push(';')
      }

      output.pop() // remove trailing semicolon
      return output.join('')
    },
    deserialize: (data: string) => {
      const graph: MarkovGraph = {
        timestamp: 0,
        words: {},
      }

      const lines = data.split(';')
      graph.timestamp = parseInt(lines[0])
      for (const line of lines.slice(1)) {
        const [startingWord, ...nextWords] = line.split(',')
        graph.words[startingWord] = {}
        for (const nextWord of nextWords) {
          const [word, count] = nextWord.split(':')
          graph.words[startingWord][word] = parseInt(count)
        }
      }

      return graph
    },
  },
}

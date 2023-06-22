import Filter from 'bad-words'
import { ChannelType, DiscordAPIError, Message, Snowflake } from 'discord.js'
import emojiRegex from 'emoji-regex'
import { getDateFromSnowflake } from '../../util/discord.js'
import { formatBytes } from '../../util/format.js'
import { GamerbotClient } from '../GamerbotClient.js'
import { ClientExtension } from './_extension.js'

interface MarkovGraph {
  timestamp: number
  words: {
    [startingWord: string]: {
      [nextWord: string]: number // weight
    }
  }
}

export default class MarkovExtension extends ClientExtension {
  #format = formats.json
  #saveInterval?: NodeJS.Timeout

  constructor(client: GamerbotClient) {
    super(client, 'markov')
  }

  graph: MarkovGraph = {
    timestamp: 0,
    words: {},
  }

  async onReady(): Promise<void> {
    await this.load()
    await this.sync()
    this.#saveInterval = setInterval(() => void this.save(), 60 * 60_000)
  }

  async load(): Promise<void> {
    this.logger.trace('LOAD')

    const data = await this.client.ext.storage.read<string>('markov')

    if (data) {
      this.graph = this.#format.deserialize(data)
    }

    let connections = 0
    for (const word of Object.values(this.graph.words)) {
      connections += Object.keys(word).length
    }

    this.logger.trace(
      `LOAD done ${Object.keys(this.graph.words).length} words, ${connections} connections`
    )
  }

  async save(): Promise<void> {
    this.logger.trace('SAVE')
    const data = this.#format.serialize(this.graph)
    await this.client.ext.storage.write('markov', data)
    this.logger.trace(`SAVE done ${formatBytes(data.length)}`)
  }

  async onMessageCreate(message: Message<boolean>): Promise<void> {
    if (!message.author.bot) {
      void this.addMessage(message.cleanContent || message.content)
    }
  }

  addMessage(message: string): void {
    this.logger.trace(`ADD message "${message}"`)

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

      this.logger.trace(`ADD edge ${word} -> ${nextWord}`)
    }
  }

  connections(seed: string): { [nextWord: string]: number } {
    return this.graph.words[seed] ?? {}
  }

  generateMessage(length: number, seed?: string, guaranteed = false): string {
    const words = [seed ?? this.getRandomWord()]

    if (guaranteed) {
      return (
        this.generateMessageRecursive(length, words)?.join(' ') ?? 'Failed to generate message.'
      )
    }

    while (words.length < length) {
      const nextWord = this.getNextWord(words[words.length - 1])
      if (!nextWord) break
      words.push(nextWord)
    }

    return words.join(' ')
  }

  generateMessageRecursive(length: number, _words: string[]): string[] | null {
    if (_words.length >= length) return _words

    const words = [..._words]

    const current = words[_words.length - 1] ?? words[words.push(this.getRandomWord())]

    const excluded: string[] = []
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const nextWord = this.getNextWord(current, excluded)
      if (!nextWord) {
        // end of branch, signal to parent
        return null
      }

      const result = this.generateMessageRecursive(length, [...words, nextWord])
      if (result === null) {
        // end of branch, try again with different next word
        excluded.push(nextWord)
        continue
      }

      // found a valid branch, return it
      return result
    }
  }

  getRandomWord(): string {
    const words = Object.keys(this.graph.words)
    return words[Math.floor(Math.random() * words.length)]
  }

  getNextWord(word: string, exclude?: string[]): string | undefined {
    const nextWords = { ...(this.graph.words[word] ?? {}) }

    for (const excludeWord of exclude ?? []) {
      delete nextWords[excludeWord]
    }

    if (Object.keys(nextWords).length === 0) return undefined

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

    this.logger.info(`SYNC start ${graphTimestamp}`)

    let messageCount = 0
    let latestTimestamp = 0

    try {
      for (const guild of this.client.guilds.cache.values()) {
        let guildMessageCount = 0

        this.logger.trace(`SYNC guild ${guild.id} ${guild.name}`)

        try {
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
              this.logger.trace(`SYNC channel ${channel.id} ${channel.name} skip`)
              continue
            }

            let channelMessageCount = 0

            this.logger.trace(`SYNC channel ${channel.id} ${channel.name}`)

            let oldestMessage: Snowflake | undefined
            let oldestMessageTimestamp = Infinity

            try {
              while (oldestMessageTimestamp > graphTimestamp) {
                this.logger.trace(
                  `SYNC messages ${channel.id} ${channel.name} ${oldestMessage ?? 'latest'}`
                )
                const messages = await channel.messages.fetch({
                  limit: 100,
                  before: oldestMessage,
                })

                if (!messages.size) {
                  this.logger.trace(`SYNC messages break`)
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
                  guildMessageCount++
                  messageCount++

                  latestTimestamp = Math.max(latestTimestamp, message.createdTimestamp)
                }
              }
            } catch (err) {
              if (err instanceof DiscordAPIError && err.code === 50001) {
                // missing access, ignore
              } else {
                this.logger.error(`SYNC messages error`, err)
              }
            }

            this.logger.trace(`SYNC channel done ${channelMessageCount}`)
          }
        } catch (err) {
          this.logger.error(`SYNC guild error`, err)
        }

        this.logger.trace(`SYNC guild done ${guildMessageCount}`)
      }
    } catch (err) {
      this.logger.error(`SYNC guild error`, err)
    }

    this.graph.timestamp = Math.max(this.graph.timestamp, latestTimestamp)

    this.logger.info(`SYNC done ${messageCount}`)
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

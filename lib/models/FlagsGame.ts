import { bold, userMention } from 'discord.js'
import yaml from 'js-yaml'
import fs from 'node:fs'
import { IS_DEVELOPMENT } from '../env.js'
import { Embed } from '../util/embed.js'
import { resolvePath } from '../util/path.js'
import { MultiplayerGame } from './MultiplayerGame.js'

const makeImageUrl = (base: string, prefix: string, image: string): string =>
  `${base}/${prefix[0]}/${prefix}/${image}/512px-${image}.png`

export const cleanName = (name: string): string =>
  name
    .toLowerCase()
    .replaceAll(/[^a-z0-9 ]/g, '')
    .trim()

export const flags: Flag[] = []

const flagData = yaml.load(
  fs.readFileSync(resolvePath('assets/flags.yaml')).toString('utf-8')
) as FlagYaml
if (typeof flagData !== 'object') throw new Error('flags.yaml must be object')

for (const flag of flagData.flags) {
  flags.push({
    displayName: flag.name,
    names: [flag.name, ...(flag.aliases ?? [])].map(cleanName).filter((name) => name.length > 0),
    imageUrl: makeImageUrl(flagData.url, flag.prefix, flag.image),
  })
}

export interface Flag {
  displayName: string
  names: string[]
  imageUrl: string
}

export interface FlagData {
  name: string
  aliases?: string[]
  prefix: string
  image: string
}

export interface FlagYaml {
  url: string
  flags: FlagData[]
}

export class FlagsGame extends MultiplayerGame {
  flagsLeft: Flag[] = [...flags]
  scores: Map<string, number> = new Map()

  nextFlag(): Flag | undefined {
    if (this.flagsLeft.length === 0) return undefined

    const index = Math.floor(Math.random() * this.flagsLeft.length)
    const flag = this.flagsLeft[index]
    this.flagsLeft.splice(index, 1)
    return flag
  }

  static isCorrectGuess(flag: Flag, guess: string): boolean {
    return flag.names.some((name) => name === cleanName(guess))
  }

  static makeHint(name: string, hintedChars: number) {
    const chars = name.split('')
    const hint: string[] = []
    let hinted = 0
    for (const char of chars) {
      if (char === ' ') {
        hint.push(' ')
      } else if (hinted < hintedChars) {
        hinted++
        hint.push(char)
      } else {
        hint.push('_')
      }
    }

    return `\`${hint.join(' ')}\``
  }

  async delay(ms: number): Promise<boolean> {
    const expiresAt = Date.now() + ms
    while (true) {
      const messages = await this.channel.awaitMessages({
        max: 1,
        time: expiresAt - Date.now(),
        dispose: true,
      })

      if (!messages.size) return false

      const message = messages.first()!

      if (message.content === '.stop' && message.author.id === this.creator.id) {
        return true
      }
    }
  }

  scoreboard(): string {
    return [...this.scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(
        ([id, score], i) =>
          `**${i + 1}.** ${userMention(id)}: ${score} point${score === 1 ? '' : 's'}`
      )
      .join('\n')
  }

  async main(): Promise<void> {
    if (await this.delay(15000)) {
      return
    }

    let flag: Flag | undefined
    let stopped = false
    let round = 1
    while ((flag = this.nextFlag()) && !stopped) {
      let footerText = 'Timeout: 60s  |  Creator:   .stop to end game  •  .skip to skip round'
      if (IS_DEVELOPMENT) {
        footerText += `  |  ${flag.displayName}`
      }

      const image = await fetch(flag.imageUrl).then((r) => r.arrayBuffer())

      this.channel.send({
        embeds: [
          new Embed({
            title: `Round ${round++}: What country is this flag from?`,
            image: { url: `attachment://flag.png` },
            footer: { text: footerText },
          }),
        ],
        files: [
          {
            name: 'flag.png',
            attachment: Buffer.from(image),
          },
        ],
      })

      const expiresAt = Date.now() + 60000
      let hintedChars = 0

      while (true) {
        const nextMessage = await this.channel.awaitMessages({
          max: 1,
          time: expiresAt - Date.now(),
          dispose: true,
        })

        if (nextMessage.size === 0) {
          stopped = true
          this.channel.send({
            embeds: [
              Embed.error(`No one answered in time! The country was ${bold(flag.displayName)}.`),
            ],
          })
          await new Promise((resolve) => setTimeout(resolve, 5000))
          break
        }

        const { author: user, content: message } = nextMessage.first()!

        if (message === '.hint') {
          const hint = FlagsGame.makeHint(flag.displayName, ++hintedChars)

          this.channel.send({
            embeds: [Embed.success(`${bold('Hint')}: ${hint}`)],
          })

          continue
        }

        if (message === '.stop' && user.id === this.creator.id) {
          stopped = true
          break
        }

        if (message === '.skip' && user.id === this.creator.id) {
          this.channel.send({
            embeds: [Embed.error(`Round skipped! The next round will start in 10 seconds.`)],
          })
          if (await this.delay(10000)) {
            stopped = true
          }
          break
        }

        if (FlagsGame.isCorrectGuess(flag, message)) {
          const newScore = (this.scores.get(user.id) ?? 0) + 1
          this.scores.set(user.id, newScore)
          this.channel.send({
            embeds: [
              Embed.success(
                `${userMention(user.id)} guessed ${bold(
                  flag.displayName
                )} correctly! They now have ${newScore} point${newScore !== 1 ? 's' : ''}.`
              ),
            ],
          })

          if (await this.delay(5000)) {
            stopped = true
            break
          }

          this.channel.send({
            embeds: [
              new Embed({
                title: 'Scoreboard',
                description: this.scoreboard(),
              }),
            ],
          })

          if (await this.delay(15000)) {
            stopped = true
          }

          break
        }
      }
    }

    const winner = this.scores.size === 0 ? undefined : [...this.scores.entries()][0]

    this.channel.send({
      embeds: [
        new Embed({
          title: 'Game over!',
          description: `The game has ended! ${
            this.scores.size === 0
              ? 'No one guessed correctly.'
              : `The winner is ${userMention(winner![0])} with ${winner![1]} point${
                  winner![1] !== 1 ? 's' : ''
                }!`
          }\n\n${bold('Scoreboard')}\n${this.scoreboard()}
          `,
        }),
      ],
    })
    return
  }
}

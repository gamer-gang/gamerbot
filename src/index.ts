/* eslint-disable @typescript-eslint/no-floating-promises */
import log4js from 'log4js'
import 'source-map-support'
import { GamerbotClient } from './client/GamerbotClient.js'
import { deployCommands } from './deploy.js'
import env from './env.js'
import { prisma } from './prisma.js'
import { Embed } from './util/embed.js'

const client = new GamerbotClient()
Embed.setClient(client)

client.on('ready', async () => {
  client.getLogger('ready').info(`${client.user.tag} ready`)
  void client.refreshPresence()
  void deployCommands(client)
})

void client.login(env.DISCORD_TOKEN)

let isExiting = false
const exit = (): void => {
  if (isExiting) return
  isExiting = true
  const logger = client.getLogger('exit')
  logger.info('Flushing markov')
  client.markov.save().then(() => {
    logger.info('Closing database connection')
    prisma.$disconnect().then(() => {
      logger.info('Destroying client')
      client.destroy()
      logger.info('Shutting down log4js')
      log4js.shutdown()
      logger.info('Exiting')
      process.exit(0)
    })
  })
}

process.on('SIGINT', exit)
process.on('SIGTERM', exit)
process.on('SIGUSR2', exit)

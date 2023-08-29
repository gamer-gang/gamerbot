import { PrismaClient } from '@prisma/client'
import log4js from 'log4js'
import { IS_DEVELOPMENT } from './env.js'
import { initLogger } from './logger.js'

initLogger()

export const prisma = new PrismaClient({
  errorFormat: IS_DEVELOPMENT ? 'pretty' : 'colorless',
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' },
    { emit: 'event', level: 'error' },
  ],
})

const logger = log4js.getLogger('prisma')

prisma.$on('query', (query) => logger.trace(query.query))
prisma.$on('info', (info) => logger.info(info.message))
prisma.$on('warn', (warn) => logger.warn(warn.message))
prisma.$on('error', (error) => logger.error(error.message))

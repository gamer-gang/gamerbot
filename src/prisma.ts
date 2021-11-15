import Prisma from '@prisma/client'
import winston from 'winston'
import { DEVELOPMENT } from './constants.js'
import { resolvePath } from './util/path.js'

const loggerConfig = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
  },
}

const logger = winston.createLogger({
  levels: loggerConfig.levels,
  transports: DEVELOPMENT
    ? [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.label({ label: 'prisma', message: true }),
            winston.format.cli({ colors: loggerConfig.colors }),
            winston.format.errors()
          ),
          level: 'debug',
        }),
      ]
    : [
        new winston.transports.File({
          filename: resolvePath('logs/prisma-info.log'),
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
          level: 'info',
        }),
        new winston.transports.File({
          filename: resolvePath('logs/prisma-error.log'),
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
          level: 'error',
        }),
      ],
})

export const prisma = new Prisma.PrismaClient({
  errorFormat: DEVELOPMENT ? 'pretty' : 'colorless',
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' },
    { emit: 'event', level: 'error' },
  ],
})

prisma.$on('query', (query) => logger.debug(query.query))
prisma.$on('info', (info) => logger.info(info))
prisma.$on('warn', (warn) => logger.warn(warn))
prisma.$on('error', (error) => logger.error(error))

import log4js, { type Appender, type DateFileAppender } from 'log4js'
import { IS_DEBUG, IS_DEVELOPMENT } from './constants.js'
import { resolvePath } from './util/path.js'

interface Category {
  appenders: string[]
  level: string
  enableCallStack?: boolean | undefined
}

const fileAppender: Omit<DateFileAppender, 'filename'> = {
  type: 'dateFile',
  keepFileExt: true,
  compress: true,
}

const file = (filename: string, level: string): { [name: string]: Appender } => ({
  [`_${filename}`]: { ...fileAppender, filename: resolvePath(filename) },
  [filename]: {
    type: 'logLevelFilter',
    appender: `_${filename}`,
    maxLevel: 'mark',
    level,
  },
})

const DEFAULT_PATTERN = '%[%d{yyyy-MM-dd HH:mm:ss} %p %c -%] %m'
const stdout = (name: string, pattern?: string): { [name: string]: Appender } => ({
  [`_${name}`]: {
    type: IS_DEBUG ? 'console' : 'stdout',
    layout: IS_DEVELOPMENT ? { type: 'pattern', pattern: pattern ?? DEFAULT_PATTERN } : undefined,
  },
  [name]: {
    type: 'logLevelFilter',
    appender: `_${name}`,
    maxLevel: 'mark',
    level: IS_DEVELOPMENT ? 'trace' : 'info',
  },
})

const category = (
  name: string,
  stdout: string,
  ...files: string[]
): { [name: string]: Category } => ({
  [name]: {
    appenders: IS_DEVELOPMENT ? [stdout] : [stdout, ...files],
    level: 'trace',
    enableCallStack: true,
  },
})

let initialized = false
export const initLogger = (): void => {
  if (initialized) return
  initialized = true

  log4js.configure({
    appenders: {
      ...file('info.log', 'info'),
      ...file('warn.log', 'warn'),
      ...file('prisma-info.log', 'info'),
      ...file('prisma-warn.log', 'warn'),

      ...stdout('console', '%[%c %f{2}:%l:%o: %m%]'),
      ...stdout('client', '%[ﮧ %f{2}:%l:%o: %m%]'),
      ...stdout('prisma', '%[ %m%]'),
      ...stdout('discord', '%[ﭮ %m%]'),
      ...stdout('command', '%[ﲵ %m%]'),
      ...stdout('analytics', '%[ %m%]'),
      ...stdout('api', '%[ %m%]'),
    },
    categories: {
      ...category('default', 'console', 'warn.log', 'info.log'),
      ...category('client', 'client', 'warn.log', 'info.log'),
      ...category('prisma', 'prisma', 'prisma-warn.log', 'prisma-info.log'),
      ...category('discord', 'discord'),
      ...category('command', 'command'),
      ...category('analytics', 'analytics'),
      ...category('api', 'api'),
    },
  })
}

import { createEnv } from '@t3-oss/env-core'
import { GatewayIntentBits } from 'discord.js'
import { z } from 'zod'
import { createReleaseName, getVersion } from './version.js'

const env = createEnv({
  runtimeEnv: process.env,
  clientPrefix: '',
  client: {},
  server: {
    NODE_ENV: z.string().optional().default('production'),
    DEBUG: z.coerce.boolean().optional().default(false),
    DOCKER: z.coerce.boolean().optional().default(false),

    DISCORD_TOKEN: z.string(),
    DATABASE_URL: z.string().url(),

    // BOT_ADMINISTRATORS: z.string().optional(),
    EVAL_ALLOWED_USERS: z.string().optional(),

    SUPPORT_SERVER_INVITE: z.string(),
    MEDIA_SERVER_ID: z.string().optional(),
    DEVELOPMENT_GUILD_ID: z.string().optional(),

    SENTRY_DSN: z.string().url().optional(),

    WIKIPEDIA_CONTACT: z.string(),
    HYPIXEL_CACHE_URL: z.string().optional(),
    HYPIXEL_CACHE_SECRET: z.string().optional(),

    API_KEY: z.string().optional(),
  },
})

export default env

export const IS_DEVELOPMENT = env.NODE_ENV === 'development'

export const CLIENT_INTENTS = [
  GatewayIntentBits.DirectMessages,
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildMessageReactions,
  GatewayIntentBits.GuildBans,
  GatewayIntentBits.GuildEmojisAndStickers,
  GatewayIntentBits.GuildInvites,
  GatewayIntentBits.MessageContent,
]

export const SENTRY_RELEASE = await createReleaseName()
export const GAMERBOT_VERSION = await getVersion()

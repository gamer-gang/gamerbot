import fastifyMiddie from '@fastify/middie'
import initFastify from 'fastify'
import { PinoLoggerOptions } from 'fastify/types/logger.js'
import { uptime } from '../../commands/general/uptime.js'
import env, { IS_DEVELOPMENT } from '../../env.js'
import { GamerbotClient } from '../GamerbotClient.js'
import { ClientExtension } from './_extension.js'

const devLogger: PinoLoggerOptions = {
  transport: {
    target: 'pino-pretty',
    options: {
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  },
}

const prodLogger = true

export default class APIExtension extends ClientExtension {
  constructor(client: GamerbotClient) {
    super(client, 'api')
  }

  fastify = initFastify({ logger: IS_DEVELOPMENT ? devLogger : prodLogger })

  async onReady(): Promise<void> {
    await this.fastify.register(fastifyMiddie)
    if (!env.API_KEY) {
      this.logger.error('API_KEY environment variable not set. API will not work.')
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      this.fastify.use((req, res, next) => {
        res.writeHead(500)
        res.end(JSON.stringify({ status: 'error', message: 'API_KEY not set' }))
      })
      return
    }

    this.fastify.use((req, res, next) => {
      if (req.headers['x-api-key'] !== env.API_KEY) {
        res.writeHead(401)
        res.end(JSON.stringify({ status: 'error', message: 'unauthorized' }))
      }

      next()
    })

    this.fastify.get('/ping', async () => ({ status: 'ok' }))
    this.fastify.get('/status', async () => ({
      status: 'ok',
      uptime: uptime(),
      guilds: await this.client.ext.counts.countGuilds(),
      users: await this.client.ext.counts.countUsers(),
      commands: this.client.commands.size,
      website: 'https://gamerbot.dev',
      reference: 'https://gamerbot.dev/commands',
      invite: 'https://gamerbot.dev/invite',
      support: 'https://gamerbot.dev/support',
    }))

    this.fastify.post('/eval', async (request, reply) => {
      const { code } = request.body as { code: string }
      if (code == null) {
        return { status: 'error', message: 'code not provided' }
      }

      try {
        const output = await this.client.ext.eval.execute(code)
        return { status: 'ok', output }
      } catch (error) {
        reply.status(400)
        return { status: 'error', message: error.message }
      }
    })

    this.fastify.listen({
      host: '0.0.0.0',
      port: 3000,
    })
  }
}

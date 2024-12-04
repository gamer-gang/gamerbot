import { Elysia, t } from 'elysia'
import { uptime } from '../../commands/general/uptime.js'
import env from '../../env.js'
import { GamerbotClient } from '../GamerbotClient.js'
import { ClientExtension } from './_extension.js'

export default class APIExtension extends ClientExtension {
  constructor(client: GamerbotClient) {
    super(client, 'api')
  }

  elysia = new Elysia()

  async onReady(): Promise<void> {
    if (!env.API_KEY) {
      this.logger.error(
        'API_KEY environment variable not set. API will not work.'
      )
      this.elysia.all('*', () => {
        return Response.json(
          { status: 'error', message: 'API_KEY not set' },
          {
            status: 500,
          }
        )
      })
      return
    }

    this.elysia.onRequest((ctx) => {
      if (ctx.request.headers.get('x-api-key') !== env.API_KEY) {
        ctx.set.status = 401
        return { status: 'error', message: 'unauthorized' }
      }
    })

    this.elysia.get('/ping', async () => ({ status: 'ok' }))
    this.elysia.get('/status', async () => await this.prepareStatus())

    this.elysia.post('/eval', async ({ body }) => this.runEval(body.code), {
      body: t.Object({
        code: t.Optional(t.Union([t.String(), t.Null()])),
      }),
    })

    this.elysia.listen({
      hostname: '0.0.0.0',
      port: 3000,
    })
  }

  private async prepareStatus(): Promise<Record<string, unknown>> {
    return {
      status: 'ok',
      uptime: uptime(),
      guilds: await this.client.ext.counts.countGuilds(),
      users: await this.client.ext.counts.countUsers(),
      commands: this.client.commands.size,
      website: 'https://gamerbot.dev',
      reference: 'https://gamerbot.dev/commands',
      invite: 'https://gamerbot.dev/invite',
      support: 'https://gamerbot.dev/support',
    }
  }

  private async runEval(code?: string | null): Promise<unknown> {
    if (code == null) {
      return { status: 'error', message: 'code not provided' }
    }

    try {
      const output = await this.client.ext.eval.execute(code)
      return { status: 'ok', output }
    } catch (error) {
      return Response.json(
        { status: 'error', message: error.message },
        {
          status: 400,
        }
      )
    }
  }
}

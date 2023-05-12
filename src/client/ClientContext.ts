import * as Sentry from '@sentry/node'

export class ClientContext {
  transaction: Sentry.Transaction | null = null
}

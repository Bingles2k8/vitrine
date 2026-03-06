export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError = (...args: unknown[]) => {
  const { captureRequestError } = require('@sentry/nextjs')
  captureRequestError(...args)
}

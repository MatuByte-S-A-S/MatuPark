import { handleBillingRequest } from './billing-api.mjs'

/** Monta la API de facturación en el servidor de desarrollo de Vite (sin puerto 3001). */
export function billingApiPlugin() {
  return {
    name: 'matupark-billing-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/billing')) {
          next()
          return
        }
        void handleBillingRequest(req, res).catch((err) => {
          console.error('[billing-api]', err)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Error interno' }))
          }
        })
      })
    },
  }
}

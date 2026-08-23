import type { NextFunction, Request, Response } from 'express'
import { env } from '../env.js'

/**
 * Gates every /api/* route behind a static API key, since these are about to
 * become publicly reachable for Yoxa to call. Yoxa sends it back as the
 * X-API-Key header after the connector's securityScheme is configured with
 * this same value at upload time.
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const provided = req.header('x-api-key')
  if (!provided || provided !== env.connectorApiKey) {
    return res.status(401).json({ error: 'missing or invalid X-API-Key' })
  }
  next()
}

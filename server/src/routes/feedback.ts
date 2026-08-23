import { Router } from 'express'

export const feedbackRouter = Router()

/**
 * Placeholder for "collect_deployment_feedback". BLOCKED: no real
 * observability provider is connected yet (Datadog / Grafana / CloudWatch /
 * other). Do not build this against fabricated data — confirm the provider
 * first, then this route calls its real API and returns fast/slow-window
 * observations in the shape the Reconciliation Agent expects.
 */
feedbackRouter.get('/:submissionId', async (_req, res) => {
  res.status(501).json({
    error: 'not implemented',
    reason: 'No monitoring/observability provider has been confirmed yet — see chat.',
  })
})

import { Router } from 'express'
import { supabase } from '../supabaseClient.js'

export const feedbackRouter = Router()

/**
 * Adapter for "collect_deployment_feedback". Reads from our own
 * deployment_observations table rather than a third-party APM — the
 * services in this design (billing-service, checkout-service, etc.) are
 * conceptual, so there's nothing real for a vendor like Datadog to monitor.
 * This is the real, honest data source until an actual production service
 * and a real monitoring provider exist.
 */
feedbackRouter.get('/:submissionId', async (req, res) => {
  const { submissionId } = req.params
  const { data, error } = await supabase
    .from('deployment_observations')
    .select('submission_id, fast_window_status, fast_window_summary, slow_window_status, slow_window_summary')
    .eq('submission_id', submissionId)
    .single()

  if (error || !data) {
    return res.status(404).json({ error: 'no observations recorded yet for this submission' })
  }

  res.json({
    submissionId: data.submission_id,
    fastWindow: { status: data.fast_window_status, summary: data.fast_window_summary ?? '' },
    slowWindow: { status: data.slow_window_status, summary: data.slow_window_summary ?? '' },
  })
})

/**
 * Not a Yoxa connector — this is how an observation gets recorded in the
 * first place, since no external monitoring provider is wired up yet.
 * Call it manually (or from a future real provider's webhook) to populate
 * deployment_observations before collect_deployment_feedback reads it back.
 */
feedbackRouter.post('/:submissionId', async (req, res) => {
  const { submissionId } = req.params
  const { fastWindowStatus, fastWindowSummary, slowWindowStatus, slowWindowSummary } = req.body ?? {}

  const { data, error } = await supabase
    .from('deployment_observations')
    .upsert({
      submission_id: submissionId,
      fast_window_status: fastWindowStatus ?? 'pending',
      fast_window_summary: fastWindowSummary ?? null,
      slow_window_status: slowWindowStatus ?? 'pending',
      slow_window_summary: slowWindowSummary ?? null,
      updated_at: new Date().toISOString(),
    })
    .select('submission_id, fast_window_status, fast_window_summary, slow_window_status, slow_window_summary')
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json({ observation: data })
})

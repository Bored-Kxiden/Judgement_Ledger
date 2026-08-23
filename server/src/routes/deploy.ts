import { Router } from 'express'
import { supabase } from '../supabaseClient.js'

export const deployRouter = Router()

/**
 * Adapter for "trigger_deploy_and_notify_engineer". No real CI/CD pipeline is
 * connected yet, so this records the ship decision and logs a notification —
 * both clearly marked as stubs. Swap the marked block for a real pipeline
 * call once you tell me which CI/CD system to integrate.
 */
deployRouter.post('/:submissionId/ship', async (req, res) => {
  const { submissionId } = req.params
  const { reason, confidence, category } = req.body ?? {}

  const { data: submission, error } = await supabase
    .from('submissions')
    .update({
      status: 'shipped',
      category: category ?? undefined,
      confidence: confidence ?? undefined,
      decision_reason: reason ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
    .select('id, author, service, category, status, confidence, decision_reason')
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // --- STUB: replace with a real CI/CD pipeline trigger + notification call ---
  console.log(`[stub] deploy pipeline triggered for ${submissionId}: ${reason}`)
  console.log(`[stub] notifying ${submission.author}: "Approved and shipping — ${reason}"`)
  // --- end stub ---

  res.json({ submission, pipelineAccepted: true })
})

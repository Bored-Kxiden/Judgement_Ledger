import { Router } from 'express'
import { supabase } from '../supabaseClient.js'

export const submissionsRouter = Router()

/**
 * Trigger owner for the workflow's entry trigger ("new code change/submission").
 * Called after the engineer's automated tests have already passed. Persists
 * the submission; does not itself call Yoxa — that binding happens at
 * Release -> Integration once this route is confirmed working.
 */
submissionsRouter.post('/', async (req, res) => {
  const {
    id, author, authorInitials, service, branch, commitRef,
    testsPassed, testsTotal, files,
  } = req.body ?? {}

  if (!id || !author || !service) {
    return res.status(400).json({ error: 'id, author, and service are required' })
  }

  const { data, error } = await supabase
    .from('submissions')
    .insert({
      id,
      author,
      author_initials: authorInitials ?? null,
      service,
      branch: branch ?? null,
      commit_ref: commitRef ?? null,
      tests_passed: testsPassed ?? null,
      tests_total: testsTotal ?? null,
      status: 'submitted',
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // `files` (the diff payload) is what the entry trigger's file input carries
  // forward to Yoxa — not persisted here since there's no diff-storage table yet.
  res.status(201).json({ submission: data, files: files ?? [] })
})

submissionsRouter.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('submissions').select('*').eq('id', req.params.id).single()
  if (error) return res.status(404).json({ error: 'submission not found' })
  res.json(data)
})

/**
 * Records the Senior Approver's decision on an escalated submission
 * (EscalationPage.tsx's Approve & Deploy / Request More Signal / Block Change).
 * App-internal for now; wire to Yoxa's dispatch_senior_escalation response via
 * the deployed-HITL webhook once that stage is reached.
 */
submissionsRouter.post('/:id/escalation-decision', async (req, res) => {
  const { decision, decidedBy, reason } = req.body ?? {}
  const statusByDecision: Record<string, string> = {
    approved: 'approved',
    blocked: 'blocked',
    'more-signal': 'more_signal',
  }
  const status = statusByDecision[decision]
  if (!status) {
    return res.status(400).json({ error: 'decision must be one of approved | blocked | more-signal' })
  }

  const { data, error } = await supabase
    .from('submissions')
    .update({ status, decision_reason: reason ?? null, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json({ submission: data, decidedBy: decidedBy ?? null })
})

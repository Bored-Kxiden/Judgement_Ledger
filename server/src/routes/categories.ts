import { Router } from 'express'
import { supabase } from '../supabaseClient.js'

export const categoriesRouter = Router()

/** Adapter for "Weekly policy review" (tool_13_call). Read-only. */
const TRUST_BOUNDARY_COLUMNS =
  'category, status, min_sample_required, current_sample_size, confidence_floor, corrections, correction_severity, recommendation, reasoning'

categoriesRouter.get('/review-queue', async (_req, res) => {
  const { data, error } = await supabase
    .from('trust_boundaries')
    .select(TRUST_BOUNDARY_COLUMNS)
    .eq('status', 'escalation required')
    .order('category')
  if (error) return res.status(500).json({ error: error.message })
  res.json({ categories: data })
})

categoriesRouter.get('/', async (_req, res) => {
  const { data, error } = await supabase.from('trust_boundaries').select('*').order('category')
  if (error) return res.status(500).json({ error: error.message })
  res.json({ categories: data })
})

/**
 * Adapter for "tighten_trust_boundary". Strictly one-directional: can only
 * move a category from auto-approve trusted -> escalation required. Never
 * loosens — that only happens via /policy-proposals/:id/decision below.
 */
categoriesRouter.post('/:category/tighten', async (req, res) => {
  const category = decodeURIComponent(req.params.category)
  const { reason, submissionId } = req.body ?? {}

  const { data: current, error: readErr } = await supabase
    .from('trust_boundaries')
    .select('category, status')
    .eq('category', category)
    .single()
  if (readErr || !current) return res.status(404).json({ error: `unknown category "${category}"` })

  if (current.status === 'escalation required') {
    return res.json({
      category: current,
      changed: false,
      message: `${category} was already escalation-required; no tightening applied.`,
    })
  }

  const { data, error } = await supabase
    .from('trust_boundaries')
    .update({ status: 'escalation required', updated_at: new Date().toISOString() })
    .eq('category', category)
    .select('category, status')
    .single()
  if (error) return res.status(500).json({ error: error.message })

  console.log(`[circuit breaker] ${category} tightened to escalation-required (submission ${submissionId}): ${reason}`)
  res.json({ category: data, changed: true })
})

/**
 * The ONLY route that can loosen a trust boundary — Engineering Leadership's
 * decision on a submitted policy proposal. Never called automatically.
 */
categoriesRouter.post('/policy-proposals/:id/decision', async (req, res) => {
  const { id } = req.params
  const { decision, decidedBy } = req.body ?? {}
  if (decision !== 'approved' && decision !== 'rejected') {
    return res.status(400).json({ error: 'decision must be approved or rejected' })
  }

  const { data: proposal, error: readErr } = await supabase
    .from('policy_proposals')
    .select('*')
    .eq('id', id)
    .single()
  if (readErr || !proposal) return res.status(404).json({ error: 'proposal not found' })

  const { data: updatedProposal, error: updErr } = await supabase
    .from('policy_proposals')
    .update({ status: decision, decided_by: decidedBy ?? null, decided_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (updErr) return res.status(500).json({ error: updErr.message })

  if (decision === 'rejected') {
    return res.json({ proposal: updatedProposal, category: null })
  }

  const { data: category, error: catErr } = await supabase
    .from('trust_boundaries')
    .update({ status: 'auto-approve trusted', updated_at: new Date().toISOString() })
    .eq('category', proposal.category)
    .select()
    .single()
  if (catErr) return res.status(500).json({ error: catErr.message })

  res.json({ proposal: updatedProposal, category })
})

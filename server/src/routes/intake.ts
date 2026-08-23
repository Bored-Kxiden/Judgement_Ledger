import { Router } from 'express'
import { supabase } from '../supabaseClient.js'

export const intakeRouter = Router()

/**
 * Adapter for the "Intake summary" simulated tool (tool_15_call).
 * Yoxa's Intake Agent has already read the diff and reasoned about category
 * and confidence itself — that's model reasoning, not something this API
 * does. What this endpoint supplies is the evidence Intake can't get on its
 * own: blast radius from the service dependency graph, and matched
 * Judgment Ledger history for the category it landed on. One call, per
 * rule 5 (one simulated tool -> one connector operation).
 */
intakeRouter.get('/:submissionId/intake-context', async (req, res) => {
  const { submissionId } = req.params
  const category = req.query.category as string | undefined
  if (!category) return res.status(400).json({ error: 'category query param is required' })

  const { data: submission, error: subErr } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', submissionId)
    .single()
  if (subErr || !submission) return res.status(404).json({ error: 'submission not found' })

  const { data: dependency, error: depErr } = await supabase
    .from('service_dependencies')
    .select('downstream')
    .eq('service', submission.service)
    .single()
  if (depErr) return res.status(500).json({ error: depErr.message })

  const affectedServices: string[] = dependency?.downstream ?? []

  const { data: history, error: histErr } = await supabase
    .from('judgment_ledger')
    .select('submission_id, decision, confidence, evidence_sample_size, human_corrected, outcome, verdict')
    .eq('category', category)
    .order('created_at', { ascending: false })
  if (histErr) return res.status(500).json({ error: histErr.message })

  const { data: boundary, error: boundaryErr } = await supabase
    .from('trust_boundaries')
    .select('category, status, min_sample_required, current_sample_size, confidence_floor, corrections, correction_severity, recommendation, reasoning')
    .eq('category', category)
    .single()
  if (boundaryErr) return res.status(404).json({ error: `unknown category "${category}"` })

  res.json({
    submissionId,
    category,
    blastRadius: affectedServices.length,
    affectedServices,
    matchedHistory: history ?? [],
    matchedHistoryCount: history?.length ?? 0,
    trustBoundary: boundary,
  })
})

import { Router } from 'express'
import multer from 'multer'
import { randomUUID } from 'node:crypto'
import { supabase } from '../supabaseClient.js'

export const ledgerRouter = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

/**
 * Receiver for "Write Ledger outcome" (write_judgment_ledger_outcome).
 * Upserts the deploy-scoped verdict into judgment_ledger. observationStatus
 * defaults to "pending" so an incomplete slow-feedback window is preserved
 * rather than silently treated as a clean outcome.
 */
ledgerRouter.post('/:submissionId/outcome', upload.single('pdf'), async (req, res) => {
  const { submissionId } = req.params
  const {
    category, blastRadius, decision, confidence, evidenceSampleSize,
    humanCorrected, observationStatus, outcome, verdict,
  } = req.body ?? {}

  let outcomePdfUrl: string | null = null
  if (req.file) {
    const path = `${submissionId}/${randomUUID()}.pdf`
    const { error: uploadErr } = await supabase.storage
      .from('ledger-outcomes')
      .upload(path, req.file.buffer, { contentType: 'application/pdf' })
    if (uploadErr) return res.status(500).json({ error: uploadErr.message })
    outcomePdfUrl = path
  }

  const { data, error } = await supabase
    .from('judgment_ledger')
    .upsert({
      submission_id: submissionId,
      category,
      blast_radius: blastRadius ?? null,
      decision: decision ?? null,
      confidence: confidence ?? null,
      evidence_sample_size: evidenceSampleSize ?? null,
      human_corrected: humanCorrected ?? false,
      observation_status: observationStatus ?? 'pending',
      outcome: outcome ?? null,
      verdict: verdict ?? null,
      outcome_pdf_url: outcomePdfUrl,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })

  res.status(201).json({ ledgerEntry: data })
})

ledgerRouter.get('/', async (req, res) => {
  const category = req.query.category as string | undefined
  let query = supabase.from('judgment_ledger').select('*').order('created_at', { ascending: false })
  if (category) query = query.eq('category', category)
  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json({ entries: data })
})

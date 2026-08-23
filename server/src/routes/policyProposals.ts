import { Router } from 'express'
import multer from 'multer'
import { randomUUID } from 'node:crypto'
import { supabase } from '../supabaseClient.js'

export const policyProposalsRouter = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

/**
 * Receiver for the "Submit trust-boundary proposal" generated-output tool
 * (submit_policy_proposal). Yoxa posts the generated PDF here as multipart
 * form data alongside the proposal metadata. This only queues the proposal
 * for human review — it never writes to trust_boundaries itself.
 */
policyProposalsRouter.post('/', upload.single('pdf'), async (req, res) => {
  const { category, recommendation, reasoning } = req.body ?? {}
  if (!category || !recommendation) {
    return res.status(400).json({ error: 'category and recommendation are required' })
  }
  if (recommendation !== 'expand trust' && recommendation !== 'restore trust') {
    return res.status(400).json({ error: 'recommendation must be "expand trust" or "restore trust"' })
  }

  let proposalPdfUrl: string | null = null
  if (req.file) {
    const path = `${category}/${randomUUID()}.pdf`
    const { error: uploadErr } = await supabase.storage
      .from('policy-proposals')
      .upload(path, req.file.buffer, { contentType: 'application/pdf' })
    if (uploadErr) return res.status(500).json({ error: uploadErr.message })
    proposalPdfUrl = path
  }

  const { data, error } = await supabase
    .from('policy_proposals')
    .insert({ category, recommendation, reasoning: reasoning ?? null, proposal_pdf_url: proposalPdfUrl })
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })

  res.status(201).json({ proposal: data })
})

policyProposalsRouter.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('policy_proposals')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json({ proposals: data })
})

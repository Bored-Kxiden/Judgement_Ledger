import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import PDFDocument from 'pdfkit'
import { supabase } from '../supabaseClient.js'
import { env } from '../env.js'

export const submissionsRouter = Router()

type TriggerResult =
  | { ok: true; workflowRunId: string | null }
  | { ok: false; error: string }

/**
 * Yoxa's file-mode trigger only accepts PDF or DOC — confirmed by Yoxa
 * support after a plain-text attachment caused a server-side 500. Renders
 * the submission context as a one-page PDF.
 */
function buildSubmissionPdf(submissionId: string, service: string, author: string, fileList: unknown[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument()
    const chunks: Buffer[] = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.fontSize(16).text('Judgment Ledger — Deploy Submission', { underline: true })
    doc.moveDown()
    doc.fontSize(12).text(`Submission ID: ${submissionId}`)
    doc.text(`Service: ${service}`)
    doc.text(`Author: ${author}`)
    doc.text(`Files changed: ${fileList.length}`)
    doc.moveDown()
    doc.fontSize(10).text(JSON.stringify(fileList, null, 2))
    doc.end()
  })
}

/**
 * Fires the workflow's entry trigger (file-mode) on Yoxa. Never throws —
 * a failed trigger must not block the submission itself from succeeding;
 * it's surfaced to the caller as a safe, retryable result instead.
 */
async function triggerYoxaWorkflow(
  submissionId: string,
  service: string,
  author: string,
  files: unknown,
): Promise<TriggerResult> {
  if (!env.yoxaTriggerUrl || !env.yoxaDeploymentSecret) {
    return { ok: false, error: 'Yoxa trigger is not configured (YOXA_TRIGGER_URL / YOXA_DEPLOYMENT_SECRET unset)' }
  }

  const fileList = Array.isArray(files) ? files : []
  const pdfBuffer = await buildSubmissionPdf(submissionId, service, author, fileList)
  const form = new FormData()
  form.append('trigger_text', `New deploy submission ${submissionId} for ${service}, submitted by ${author}`)
  form.append('file', new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' }), `${submissionId}.pdf`)

  try {
    const response = await fetch(env.yoxaTriggerUrl, {
      method: 'POST',
      headers: {
        'X-Yoxa-Deployment-Secret': env.yoxaDeploymentSecret,
        'Idempotency-Key': randomUUID(),
      },
      body: form,
    })
    const body = await response.json().catch(() => null)
    if (!response.ok) {
      const detail = body?.error?.message ?? body?.error?.code ?? JSON.stringify(body)
      return { ok: false, error: `Yoxa trigger returned HTTP ${response.status}: ${detail}` }
    }
    return { ok: true, workflowRunId: body?.workflow_run_id ?? null }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error calling Yoxa trigger' }
  }
}

/**
 * Trigger owner for the workflow's entry trigger ("new code change/submission").
 * Called after the engineer's automated tests have already passed. Persists
 * the submission first, then fires the Yoxa trigger — a trigger failure is
 * reported back but does not undo the persisted submission.
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

  const trigger = await triggerYoxaWorkflow(id, service, author, files)
  let workflowRunIdPersistError: string | null = null
  if (trigger.ok && trigger.workflowRunId) {
    const { error: runIdErr } = await supabase
      .from('submissions')
      .update({ workflow_run_id: trigger.workflowRunId })
      .eq('id', id)
    if (runIdErr) {
      console.error(`Failed to persist workflow_run_id for ${id}:`, runIdErr.message)
      workflowRunIdPersistError = runIdErr.message
    }
  }

  res.status(201).json({
    submission: data,
    files: files ?? [],
    workflowTriggered: trigger.ok,
    workflowTriggerError: trigger.ok ? null : trigger.error,
    workflowRunIdPersistError,
  })
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

import { Router, raw } from 'express'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { supabase } from '../supabaseClient.js'
import { env } from '../env.js'

export const hitlRouter = Router()

const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000

/**
 * Verifies Yoxa's webhook signature. The HMAC is taken over
 * `<timestamp> + "." + <raw request-body bytes>`, so the body must be the
 * untouched bytes — never a re-serialized JSON object.
 */
function signatureIsValid(rawBody: Buffer, timestamp: string, signatureHeader: string, secret: string): boolean {
  if (!signatureHeader.startsWith('v1=')) return false
  const provided = Buffer.from(signatureHeader.slice(3))
  const expected = Buffer.from(
    createHmac('sha256', secret).update(`${timestamp}.`).update(rawBody).digest('hex'),
  )
  if (provided.length !== expected.length) return false
  return timingSafeEqual(provided, expected)
}

function timestampIsFresh(timestamp: string): boolean {
  const sent = Date.parse(timestamp)
  if (Number.isNaN(sent)) return false
  return Math.abs(Date.now() - sent) <= TIMESTAMP_TOLERANCE_MS
}

/**
 * Receiver for Yoxa's deployed human-approval webhook.
 *
 * Authenticated by HMAC signature, NOT by the connector API key — so this
 * route deliberately sits outside apiKeyAuth. The raw parser here is a
 * safety net; the mount in index.ts is what actually beats the global
 * express.json() to the body bytes the signature is computed over.
 *
 * Delivery is at-least-once: a repeated event_id is expected, not an error,
 * and must never create a second approval task.
 */
hitlRouter.post('/webhook', raw({ type: '*/*' }), async (req, res) => {
  if (!env.yoxaHitlWebhookSigningSecret) {
    return res.status(503).json({ error: 'YOXA_HITL_WEBHOOK_SIGNING_SECRET is not configured' })
  }

  const eventId = req.header('x-yoxa-webhook-id')
  const timestamp = req.header('x-yoxa-webhook-timestamp')
  const signature = req.header('x-yoxa-webhook-signature')
  if (!eventId || !timestamp || !signature) {
    return res.status(400).json({ error: 'missing Yoxa webhook headers' })
  }

  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from('')
  if (!signatureIsValid(rawBody, timestamp, signature, env.yoxaHitlWebhookSigningSecret)) {
    return res.status(401).json({ error: 'invalid signature' })
  }
  if (!timestampIsFresh(timestamp)) {
    return res.status(400).json({ error: 'stale webhook timestamp' })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody.toString('utf8'))
  } catch {
    return res.status(400).json({ error: 'body is not valid JSON' })
  }

  // Dedupe first: a duplicate delivery stops here and never re-creates a task.
  const { error: dedupeErr } = await supabase
    .from('hitl_webhook_events')
    .insert({ event_id: eventId, event_type: String(payload.event_type ?? 'unknown'), payload })
  if (dedupeErr) {
    if (dedupeErr.code === '23505') return res.status(200).json({ deduplicated: true })
    console.error('HITL webhook: failed to record event', dedupeErr.message)
    return res.status(500).json({ error: 'failed to record event' })
  }

  if (payload.event_type === 'hitl.webhook_test') {
    return res.status(200).json({ received: true, test: true })
  }

  if (payload.event_type === 'hitl.approval_requested') {
    const { error: taskErr } = await supabase.from('hitl_requests').upsert(
      {
        request_id: payload.request_id,
        event_id: eventId,
        deployment_id: payload.deployment_id,
        workflow_run_id: payload.workflow_run_id ?? null,
        title: payload.title ?? null,
        description: payload.description ?? null,
        options: payload.options ?? [],
        status: 'pending',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'request_id', ignoreDuplicates: true },
    )
    if (taskErr) {
      console.error('HITL webhook: failed to persist approval task', taskErr.message)
      return res.status(500).json({ error: 'failed to persist approval task' })
    }
    return res.status(200).json({ received: true })
  }

  // Unknown event types are still recorded above; acknowledge so Yoxa
  // doesn't retry something this version simply doesn't act on yet.
  res.status(200).json({ received: true, handled: false })
})

hitlRouter.get('/requests', async (req, res) => {
  const status = (req.query.status as string | undefined) ?? 'pending'
  const { data, error } = await supabase
    .from('hitl_requests')
    .select('request_id, workflow_run_id, title, description, options, status, selected_option_id, override_message, answered_by, answered_at, created_at')
    .eq('status', status)
    .order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json({ requests: data })
})

/**
 * The approval UI posts the human's decision here — never to Yoxa directly,
 * since the response secret must stay server-side. Forwards to Yoxa, then
 * records the outcome locally so the UI has a stable "answered" state.
 *
 * NOTE: this app has no login system yet, so there is no check that the
 * caller is an authorized Senior Approver. Add that before real use.
 */
hitlRouter.post('/requests/:requestId/respond', async (req, res) => {
  const { requestId } = req.params
  const { selectedOptionId, overrideMessage, decidedBy } = req.body ?? {}

  if (!selectedOptionId && !overrideMessage) {
    return res.status(400).json({ error: 'either selectedOptionId or overrideMessage is required' })
  }
  if (selectedOptionId && overrideMessage) {
    return res.status(400).json({ error: 'send exactly one of selectedOptionId or overrideMessage' })
  }
  if (!env.yoxaHitlResponseSecret || !env.yoxaTriggerUrl) {
    return res.status(503).json({ error: 'YOXA_HITL_RESPONSE_SECRET / YOXA_TRIGGER_URL are not configured' })
  }

  const { data: task, error: readErr } = await supabase
    .from('hitl_requests')
    .select('request_id, deployment_id, status')
    .eq('request_id', requestId)
    .single()
  if (readErr || !task) return res.status(404).json({ error: 'approval request not found' })

  const origin = new URL(env.yoxaTriggerUrl).origin
  const url = `${origin}/api/v1/public/workflow-deployments/${task.deployment_id}/hitl/requests/${requestId}/respond`
  const body = selectedOptionId ? { selected_option_id: selectedOptionId } : { override_message: overrideMessage }

  let yoxaStatus: number
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Yoxa-HITL-Response-Secret': env.yoxaHitlResponseSecret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    yoxaStatus = response.status
    if (response.status !== 202 && response.status !== 200) {
      const detail = await response.json().catch(() => null)
      return res.status(502).json({
        error: `Yoxa rejected the decision (HTTP ${response.status})`,
        detail: detail?.error?.message ?? null,
      })
    }
  } catch (err) {
    return res.status(502).json({ error: err instanceof Error ? err.message : 'failed to reach Yoxa' })
  }

  const { data: updated, error: updateErr } = await supabase
    .from('hitl_requests')
    .update({
      status: 'answered',
      selected_option_id: selectedOptionId ?? null,
      override_message: overrideMessage ?? null,
      answered_by: decidedBy ?? null,
      answered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('request_id', requestId)
    .select('request_id, workflow_run_id, status, selected_option_id, override_message, answered_by, answered_at')
    .single()
  if (updateErr) {
    console.error(`HITL respond: Yoxa accepted ${requestId} but the local update failed:`, updateErr.message)
    return res.status(500).json({ error: 'Yoxa accepted the decision but the local record failed to update' })
  }

  // 200 from Yoxa means this request had already been answered.
  res.json({ request: updated, alreadyAnswered: yoxaStatus === 200 })
})

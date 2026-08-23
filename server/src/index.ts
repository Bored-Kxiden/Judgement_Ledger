import express from 'express'
import cors from 'cors'
import { env } from './env.js'
import { apiKeyAuth } from './middleware/apiKeyAuth.js'
import { submissionsRouter } from './routes/submissions.js'
import { intakeRouter } from './routes/intake.js'
import { deployRouter } from './routes/deploy.js'
import { categoriesRouter } from './routes/categories.js'
import { policyProposalsRouter } from './routes/policyProposals.js'
import { ledgerRouter } from './routes/ledger.js'
import { feedbackRouter } from './routes/feedback.js'
import { hitlRouter } from './routes/hitl.js'

const app = express()
app.use(cors())

// The HITL webhook's HMAC covers the exact bytes Yoxa sent, so its raw body
// must be captured BEFORE the global JSON parser can consume and re-shape it.
// body-parser marks the request as read, so express.json() below skips it.
app.use('/api/hitl/webhook', express.raw({ type: '*/*' }))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))

// submissionsRouter is the app's own public-facing seam (engineer submissions,
// Senior Approver decisions) — no user-auth system exists yet, but it must
// never require the Yoxa connector key, since that would ship a real secret
// to the browser. Every other router is a Yoxa-to-server tool call and stays
// behind apiKeyAuth.
// hitlRouter is also outside apiKeyAuth: its webhook authenticates by HMAC
// signature (not the connector key), and its respond route is called by the
// approval UI in the browser.
app.use('/api/hitl', hitlRouter)
app.use('/api/submissions', submissionsRouter)
app.use('/api/deploys', apiKeyAuth, intakeRouter)
app.use('/api/deploys', apiKeyAuth, deployRouter)
app.use('/api/categories', apiKeyAuth, categoriesRouter)
app.use('/api/policy-proposals', apiKeyAuth, policyProposalsRouter)
app.use('/api/ledger', apiKeyAuth, ledgerRouter)
app.use('/api/feedback', apiKeyAuth, feedbackRouter)

app.listen(env.port, () => {
  console.log(`judgment-ledger-server listening on http://localhost:${env.port}`)
})

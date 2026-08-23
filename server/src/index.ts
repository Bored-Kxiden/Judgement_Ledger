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

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))

app.use('/api', apiKeyAuth)

app.use('/api/submissions', submissionsRouter)
app.use('/api/deploys', intakeRouter)
app.use('/api/deploys', deployRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/policy-proposals', policyProposalsRouter)
app.use('/api/ledger', ledgerRouter)
app.use('/api/feedback', feedbackRouter)

app.listen(env.port, () => {
  console.log(`judgment-ledger-server listening on http://localhost:${env.port}`)
})

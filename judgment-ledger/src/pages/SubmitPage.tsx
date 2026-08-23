import { useState } from 'react'
import { AlertTriangle, CheckCircle2, GitBranch, GitCommitHorizontal, ListChecks, Loader2, PackageCheck } from 'lucide-react'
import { Avatar } from '../components/Avatar'
import { DiffView } from '../components/DiffView'
import { StatusBadge } from '../components/StatusBadge'
import { riskySubmission, trivialSubmission, trustBoundaries } from '../data/mockData'
import type { Submission } from '../data/mockData'
import { submitDeploy } from '../lib/api'
import type { SubmitDeployResponse } from '../lib/api'

type Stage = 'idle' | 'running' | 'done' | 'error'

function generateSubmissionId() {
  return `SUB-${Date.now().toString().slice(-8)}`
}

const STEPS = [
  { title: 'Classify the change', body: 'Intake Agent reads the diff, assigns a risk category, and computes blast radius against the service dependency graph.' },
  { title: 'Check trust boundary', body: 'Threshold Agent weighs the Judgment Ledger evidence for that category against the current human-approved trust boundary.' },
  { title: 'Ship or escalate', body: 'Auto-approved changes deploy immediately. Anything else routes to a Senior Approver with full reasoning attached.' },
]

export default function SubmitPage() {
  const [sample, setSample] = useState<Submission>(riskySubmission)
  const [stage, setStage] = useState<Stage>('idle')
  const [result, setResult] = useState<SubmitDeployResponse | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const boundary = trustBoundaries.find((t) => t.category === sample.category)!

  async function handleSubmit() {
    setStage('running')
    setSubmitError(null)
    try {
      const response = await submitDeploy({
        id: generateSubmissionId(),
        author: sample.author,
        authorInitials: sample.authorInitials,
        service: sample.service,
        branch: sample.branch,
        commitRef: sample.commit,
        testsPassed: sample.testsPassed,
        testsTotal: sample.testsTotal,
        files: sample.files,
      })
      setResult(response)
      setStage('done')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed')
      setStage('error')
    }
  }

  function pickSample(s: Submission) {
    setSample(s)
    setStage('idle')
    setResult(null)
    setSubmitError(null)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Submit a change for deploy</h1>
          <div className="flex gap-2">
            <button
              onClick={() => pickSample(riskySubmission)}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium ${sample.id === riskySubmission.id ? 'border-amber/50 bg-amber-subtle text-amber-emphasis' : 'border-border text-fg-muted hover:text-fg'}`}
            >
              Load payments-logic diff
            </button>
            <button
              onClick={() => pickSample(trivialSubmission)}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium ${sample.id === trivialSubmission.id ? 'border-teal/50 bg-teal-subtle text-teal-emphasis' : 'border-border text-fg-muted hover:text-fg'}`}
            >
              Load text/copy diff
            </button>
          </div>
        </div>

        <div className="rounded-md border border-border bg-surface">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border px-4 py-3 text-sm">
            <div className="flex items-center gap-2">
              <Avatar initials={sample.authorInitials} size={22} />
              <span className="text-fg-muted">{sample.author}</span>
            </div>
            <div className="flex items-center gap-1.5 text-fg-muted">
              <GitBranch size={14} />
              <span className="font-mono text-xs">{sample.branch}</span>
            </div>
            <div className="flex items-center gap-1.5 text-fg-muted">
              <GitCommitHorizontal size={14} />
              <span className="font-mono text-xs">{sample.commit}</span>
            </div>
            <div className="ml-auto font-mono text-xs text-fg-subtle">{sample.id}</div>
          </div>

          <div className="grid grid-cols-2 gap-4 px-4 py-4 sm:grid-cols-4">
            <Field label="Service">
              <span className="font-mono text-sm">{sample.service}</span>
            </Field>
            <Field label="Files changed">
              <span className="text-sm">{sample.files.length}</span>
            </Field>
            <Field label="Automated tests">
              <span className="flex items-center gap-1.5 text-sm">
                <CheckCircle2 size={14} className="text-teal-emphasis" />
                {sample.testsPassed}/{sample.testsTotal} passed
              </span>
            </Field>
            <Field label="Timestamp">
              <span className="font-mono text-xs text-fg-muted">{sample.timestamp}</span>
            </Field>
          </div>

          <div className="space-y-3 border-t border-border px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-medium text-fg-muted">
              <ListChecks size={15} />
              Diff
            </div>
            {sample.files.map((f) => (
              <DiffView key={f.filename} file={f} />
            ))}
          </div>
        </div>

        {stage !== 'idle' && (
          <div className="rounded-md border border-border bg-surface p-4">
            {stage === 'running' ? (
              <div className="flex items-center gap-2 text-sm text-fg-muted">
                <Loader2 size={16} className="animate-spin text-amber-emphasis" />
                Submitting to the Judgment Ledger and triggering the Yoxa workflow…
              </div>
            ) : stage === 'error' ? (
              <DecisionReceipt
                tone="red"
                icon={<AlertTriangle size={18} className="text-red-emphasis" />}
                title="Submission failed"
                reason={submitError ?? 'Unknown error'}
              />
            ) : result?.workflowTriggered ? (
              <DecisionReceipt
                tone="teal"
                icon={<PackageCheck size={18} className="text-teal-emphasis" />}
                title="Submitted — workflow triggered"
                reason={`Recorded as ${result.submission.id}${result.submission.workflow_run_id ? ` (Yoxa run ${result.submission.workflow_run_id})` : ''}. The Intake and Threshold agents now decide asynchronously — check the Escalations or Policy Review tabs once a decision lands.`}
              />
            ) : (
              <DecisionReceipt
                tone="amber"
                icon={<AlertTriangle size={18} className="text-amber-emphasis" />}
                title="Submitted, but the Yoxa trigger failed"
                reason={`Recorded as ${result?.submission.id}. The submission is saved, but the workflow wasn't started: ${result?.workflowTriggerError ?? 'unknown error'}. Safe to retry.`}
              />
            )}
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <div className="rounded-md border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-fg">What happens next</h2>
          <ol className="space-y-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-[11px] font-mono text-fg-subtle">
                  {i + 1}
                </span>
                <div>
                  <div className="text-sm font-medium text-fg">{s.title}</div>
                  <div className="text-xs leading-relaxed text-fg-muted">{s.body}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-md border border-border bg-surface p-4">
          <div className="mb-2 text-xs text-fg-muted">Predicted category</div>
          <StatusBadge tone={boundary.status === 'auto-approve trusted' ? 'teal' : 'amber'}>
            {sample.category}
          </StatusBadge>
          <p className="mt-2 text-xs leading-relaxed text-fg-subtle">{boundary.reasoning}</p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={stage === 'running'}
          className="w-full rounded-md bg-amber px-4 py-2.5 text-sm font-semibold text-canvas-inset transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {stage === 'running' ? 'Submitting…' : 'Submit for deploy'}
        </button>
      </aside>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[11px] uppercase tracking-wide text-fg-subtle">{label}</div>
      {children}
    </div>
  )
}

function DecisionReceipt({
  tone,
  icon,
  title,
  reason,
}: {
  tone: 'teal' | 'amber' | 'red'
  icon: React.ReactNode
  title: string
  reason: string
}) {
  const border = tone === 'teal' ? 'border-teal/40' : tone === 'amber' ? 'border-amber/40' : 'border-red/40'
  const bg = tone === 'teal' ? 'bg-teal-subtle' : tone === 'amber' ? 'bg-amber-subtle' : 'bg-red-subtle'
  return (
    <div className={`flex gap-3 rounded-md border ${border} ${bg} p-3`}>
      {icon}
      <div>
        <div className="text-sm font-semibold text-fg">{title}</div>
        <div className="mt-0.5 text-xs leading-relaxed text-fg-muted">{reason}</div>
      </div>
    </div>
  )
}

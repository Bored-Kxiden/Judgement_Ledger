import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, GitCommitHorizontal, MessageCircleQuestion, Network, ShieldOff } from 'lucide-react'
import { Avatar } from '../components/Avatar'
import { DiffView } from '../components/DiffView'
import { StatusBadge, verdictTone } from '../components/StatusBadge'
import { TrustGauge } from '../components/TrustGauge'
import { ledgerHistory, riskySubmission, trustBoundaries } from '../data/mockData'

type Action = null | 'approved' | 'blocked' | 'more-signal'

export default function EscalationPage() {
  const [action, setAction] = useState<Action>(null)
  const sub = riskySubmission
  const boundary = trustBoundaries.find((t) => t.category === sub.category)!
  const evidence = ledgerHistory.filter((e) => e.category === sub.category)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <AlertTriangle size={18} className="text-amber-emphasis" />
        <h1 className="text-xl font-semibold">Escalated for human review</h1>
        <StatusBadge tone="amber">{sub.category}</StatusBadge>
        <span className="font-mono text-xs text-fg-subtle">{sub.id}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left: change context */}
        <div className="space-y-4">
          <div className="rounded-md border border-border bg-surface p-4">
            <div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Avatar initials={sub.authorInitials} size={22} />
                <span className="text-fg-muted">{sub.author}</span>
              </div>
              <div className="flex items-center gap-1.5 text-fg-muted">
                <GitCommitHorizontal size={14} />
                <span className="font-mono text-xs">{sub.commit}</span>
              </div>
              <div className="text-fg-muted">
                service <span className="font-mono text-fg">{sub.service}</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-fg-muted">
              Increases retry attempts and backoff on payment operations, adds a duplicate-charge guard, and
              generates a fallback idempotency key when one is missing from the webhook payload. Touches core
              payment retry and webhook-handling logic.
            </p>
          </div>

          <div className="rounded-md border border-border bg-surface p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-fg-muted">
              <Network size={15} />
              Blast radius — {sub.affectedServices.length} downstream services
            </div>
            <div className="flex flex-wrap gap-2">
              {sub.affectedServices.map((s) => (
                <span key={s} className="rounded-full border border-border bg-surface-raised px-2.5 py-1 font-mono text-xs text-fg-muted">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-fg-muted">Diff summary</div>
            {sub.files.map((f) => (
              <DiffView key={f.filename} file={f} />
            ))}
          </div>
        </div>

        {/* Right: trust gauge + evidence + actions */}
        <aside className="space-y-4">
          <div className="rounded-md border border-border bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold text-fg">Why this was escalated</h2>
            <TrustGauge
              currentSampleSize={boundary.currentSampleSize}
              minSampleRequired={boundary.minSampleRequired}
              confidence={sub.confidence}
              confidenceFloor={boundary.confidenceFloor}
            />
            <p className="mt-4 text-xs leading-relaxed text-fg-muted">
              <span className="font-semibold text-amber-emphasis">payments logic</span> sits below the trust
              threshold: {boundary.currentSampleSize} evidence samples against a {boundary.minSampleRequired}-sample
              minimum, with {boundary.corrections} human correction{boundary.corrections === 1 ? '' : 's'} on
              record — including a case that caught a rounding error pre-deploy. The Threshold Agent cannot
              expand this boundary itself; it can only escalate.
            </p>
          </div>

          <div className="rounded-md border border-border bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold text-fg">Evidence trail — {evidence.length} matching entries</h2>
            <ul className="space-y-3">
              {evidence.map((e) => (
                <li key={e.submissionId} className="border-l-2 border-border pl-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-fg-muted">{e.submissionId}</span>
                    <StatusBadge tone={verdictTone(e.verdict)}>{e.verdict}</StatusBadge>
                  </div>
                  <div className="mt-0.5 text-xs text-fg-subtle">{e.outcome}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-md border border-border bg-surface p-4">
            {action ? (
              <ResultNote action={action} />
            ) : (
              <>
                <div className="mb-3 flex items-center gap-2 text-xs text-fg-subtle">
                  <Clock size={13} />
                  Blocked until reviewed — no automatic timeout approval.
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => setAction('approved')}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-teal px-4 py-2.5 text-sm font-semibold text-canvas-inset hover:opacity-90"
                  >
                    <CheckCircle2 size={16} />
                    Approve & Deploy
                  </button>
                  <button
                    onClick={() => setAction('more-signal')}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-surface-raised px-4 py-2.5 text-sm font-medium text-fg hover:bg-surface-hover"
                  >
                    <MessageCircleQuestion size={16} />
                    Request More Signal
                  </button>
                  <button
                    onClick={() => setAction('blocked')}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-red/40 bg-red-subtle px-4 py-2.5 text-sm font-medium text-red-emphasis hover:opacity-90"
                  >
                    <ShieldOff size={16} />
                    Block Change
                  </button>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

function ResultNote({ action }: { action: Exclude<Action, null> }) {
  if (action === 'approved') {
    return (
      <div className="flex gap-3">
        <CheckCircle2 size={18} className="shrink-0 text-teal-emphasis" />
        <div>
          <div className="text-sm font-semibold text-fg">Approved & deploying</div>
          <div className="mt-0.5 text-xs leading-relaxed text-fg-muted">
            Written to the Judgment Ledger. Reconciliation Agent begins watching outcome signals once the deploy
            ships.
          </div>
        </div>
      </div>
    )
  }
  if (action === 'blocked') {
    return (
      <div className="flex gap-3">
        <ShieldOff size={18} className="shrink-0 text-red-emphasis" />
        <div>
          <div className="text-sm font-semibold text-fg">Change blocked</div>
          <div className="mt-0.5 text-xs leading-relaxed text-fg-muted">
            Author A. Verma notified. Outcome recorded in the Ledger as a pre-deploy catch.
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="flex gap-3">
      <MessageCircleQuestion size={18} className="shrink-0 text-amber-emphasis" />
      <div>
        <div className="text-sm font-semibold text-fg">More signal requested</div>
        <div className="mt-0.5 text-xs leading-relaxed text-fg-muted">
          Author asked to clarify duplicate-charge handling before this decision proceeds.
        </div>
      </div>
    </div>
  )
}

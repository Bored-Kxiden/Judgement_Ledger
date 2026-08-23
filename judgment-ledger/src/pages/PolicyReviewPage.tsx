import { useState } from 'react'
import { Check, Info, ShieldCheck, Users, X } from 'lucide-react'
import { StatusBadge } from '../components/StatusBadge'
import { trustBoundaries } from '../data/mockData'
import type { CategoryTrust } from '../data/mockData'

type Verdict = null | 'approved' | 'rejected'

export default function PolicyReviewPage() {
  const pending = trustBoundaries.filter((c) => c.status === 'escalation required')
  const trusted = trustBoundaries.filter((c) => c.status === 'auto-approve trusted')
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({})

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users size={18} className="text-amber-emphasis" />
        <h1 className="text-xl font-semibold">Weekly policy review</h1>
        <span className="rounded-full border border-border px-2 py-0.5 text-xs text-fg-muted">
          Engineering Leadership
        </span>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-border bg-surface px-4 py-3 text-xs leading-relaxed text-fg-muted">
        <Info size={15} className="mt-0.5 shrink-0 text-blue" />
        This is the only place a category's trust boundary can move upward. Approvals here are the sole
        mechanism to expand or restore trust — nothing in the automated system applies a change on its own.
        The Reconciliation Agent may still tighten a category automatically at any time if a bad outcome lands
        in an auto-approved category.
      </div>

      <div className="space-y-3">
        {pending.map((c) => (
          <CategoryRow
            key={c.category}
            category={c}
            verdict={verdicts[c.category] ?? null}
            onVerdict={(v) => setVerdicts((prev) => ({ ...prev, [c.category]: v }))}
          />
        ))}
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg-muted">
          <ShieldCheck size={15} className="text-teal-emphasis" />
          Already trusted — no action needed
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {trusted.map((c) => (
            <div key={c.category} className="rounded-md border border-border bg-surface p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-medium text-fg">{c.category}</span>
                <StatusBadge tone="teal">auto-approve trusted</StatusBadge>
              </div>
              <div className="font-mono text-xs text-fg-subtle">
                {c.currentSampleSize} samples · {c.corrections} corrections
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CategoryRow({
  category,
  verdict,
  onVerdict,
}: {
  category: CategoryTrust
  verdict: Verdict
  onVerdict: (v: Verdict) => void
}) {
  const c = category
  const samplePct = Math.min(100, (c.currentSampleSize / c.minSampleRequired) * 100)
  const severityTone = c.correctionSeverity === 'severe' ? 'red' : c.correctionSeverity === 'minor' ? 'amber' : 'neutral'

  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-fg">{c.category}</span>
          <StatusBadge tone="amber">escalation required</StatusBadge>
        </div>
        <span className="font-mono text-xs text-fg-subtle">
          {c.currentSampleSize} / {c.minSampleRequired} samples
        </span>
      </div>

      <div className="my-3 h-1.5 overflow-hidden rounded-full bg-surface-raised">
        <div className="h-full rounded-full bg-amber" style={{ width: `${samplePct}%` }} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs text-fg-subtle">Correction history</span>
            <StatusBadge tone={severityTone as 'red' | 'amber' | 'neutral'}>
              {c.corrections} correction{c.corrections === 1 ? '' : 's'}
              {c.correctionSeverity !== 'none' ? ` · ${c.correctionSeverity}` : ''}
            </StatusBadge>
          </div>
          <div>
            <span className="text-xs text-fg-subtle">Recommendation: </span>
            <span className="font-medium text-fg">{c.recommendation}</span>
          </div>
          <p className="text-xs leading-relaxed text-fg-muted">{c.reasoning}</p>
        </div>

        <div className="flex shrink-0 items-start gap-2">
          {verdict ? (
            <span
              className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium ${
                verdict === 'approved' ? 'border-teal/40 bg-teal-subtle text-teal-emphasis' : 'border-red/40 bg-red-subtle text-red-emphasis'
              }`}
            >
              {verdict === 'approved' ? <Check size={13} /> : <X size={13} />}
              {verdict === 'approved' ? 'Recommendation approved' : 'Recommendation rejected'}
            </span>
          ) : (
            <>
              <button
                onClick={() => onVerdict('approved')}
                className="flex items-center gap-1.5 rounded-md border border-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-fg hover:bg-surface-hover"
              >
                <Check size={13} />
                Approve
              </button>
              <button
                onClick={() => onVerdict('rejected')}
                className="flex items-center gap-1.5 rounded-md border border-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-fg hover:bg-surface-hover"
              >
                <X size={13} />
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

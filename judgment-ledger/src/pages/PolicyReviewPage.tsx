import { useState } from 'react'
import { Activity, ChevronDown, Check, Database, Info, Layers, ShieldCheck, Users, X } from 'lucide-react'
import { StatusBadge, verdictTone } from '../components/StatusBadge'
import { GlassCard } from '../components/GlassCard'
import { ledgerHistory, trustBoundaries } from '../data/mockData'
import type { Category, CategoryTrust, LedgerEntry } from '../data/mockData'
import { useDocumentTitle } from '../lib/useDocumentTitle'

type Verdict = null | 'approved' | 'rejected'

const ALL_CATEGORIES: Category[] = [
  'payments logic',
  'auth/permissions',
  'data schema migration',
  'infra/scaling',
  'config change',
  'text/copy change',
]

const toneDot: Record<'teal' | 'amber' | 'red' | 'neutral' | 'blue', string> = {
  teal: 'bg-teal',
  amber: 'bg-amber',
  red: 'bg-red',
  neutral: 'bg-fg-subtle',
  blue: 'bg-blue',
}

export default function PolicyReviewPage() {
  useDocumentTitle('Policy Review')
  const pending = trustBoundaries.filter((c) => c.status === 'escalation required')
  const trusted = trustBoundaries.filter((c) => c.status === 'auto-approve trusted')
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({})

  const totalCorrections = trustBoundaries.reduce((sum, c) => sum + c.corrections, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Users size={18} className="shrink-0 text-amber-emphasis" />
        <h1 className="text-lg font-semibold sm:text-xl">Weekly policy review</h1>
        <span className="rounded-full border border-border px-2 py-0.5 text-xs text-fg-muted">
          Engineering Leadership
        </span>
      </div>

      {/* ---------- The actual task: categories waiting on a decision ---------- */}
      <div className="flex items-start gap-2 rounded-md border border-border bg-surface/60 px-4 py-3 text-xs leading-relaxed text-fg-muted">
        <Info size={15} className="mt-0.5 shrink-0 text-blue" />
        This is the only place a category's trust boundary can move upward. Approvals here are the sole
        mechanism to expand or restore trust — nothing in the automated system applies a change on its own.
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

      {/* ---------- Everything below is reference, not action — tucked away by default ---------- */}
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md border border-border bg-surface/60 px-4 py-3 text-sm font-medium text-fg-muted hover:text-fg [&::-webkit-details-marker]:hidden">
          <ChevronDown size={15} className="shrink-0 transition-transform group-open:rotate-180" />
          Evidence &amp; trends
          <span className="ml-auto text-xs font-normal text-fg-subtle">
            {trustBoundaries.length} categories · {ledgerHistory.length} ledger entries
          </span>
        </summary>

        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile icon={Layers} label="Categories tracked" value={trustBoundaries.length} />
            <StatTile icon={ShieldCheck} label="Auto-approve trusted" value={trusted.length} tone="teal" />
            <StatTile icon={Users} label="Escalation required" value={pending.length} tone="amber" />
            <StatTile icon={Database} label="Ledger entries" value={ledgerHistory.length} sub={`${totalCorrections} corrections`} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
            <GlassCard className="p-4">
              <div className="mb-1 flex items-center gap-2">
                <Activity size={15} className="text-fg-muted" />
                <h2 className="text-sm font-semibold text-fg">Evidence activity by category</h2>
              </div>
              <p className="mb-4 text-xs text-fg-subtle">
                Every Judgment Ledger entry, in order, per category. Hover a square for the submission.
              </p>
              <EvidenceHeatmap />
            </GlassCard>

            <GlassCard className="flex flex-col p-4">
              <h2 className="mb-3 text-sm font-semibold text-fg">Recent ledger activity</h2>
              <ActivityFeed />
            </GlassCard>
          </div>

          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg-muted">
              <ShieldCheck size={15} className="text-teal-emphasis" />
              Already trusted — no action needed
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {trusted.map((c) => (
                <GlassCard key={c.category} className="p-4">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-medium text-fg">{c.category}</span>
                    <StatusBadge tone="teal">auto-approve trusted</StatusBadge>
                  </div>
                  <div className="font-mono text-xs text-fg-subtle">
                    {c.currentSampleSize} samples · {c.corrections} corrections
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </div>
      </details>
    </div>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: number
  sub?: string
  tone?: 'teal' | 'amber'
}) {
  const iconTone = tone === 'teal' ? 'text-teal-emphasis' : tone === 'amber' ? 'text-amber-emphasis' : 'text-fg-muted'
  return (
    <GlassCard hover className="p-4">
      <Icon size={16} className={iconTone} />
      <div className="mt-3 font-mono text-3xl font-medium leading-none text-fg">{value}</div>
      <div className="mt-1.5 text-xs text-fg-muted">{label}</div>
      {sub && <div className="mt-0.5 text-[11px] text-fg-subtle">{sub}</div>}
    </GlassCard>
  )
}

function EvidenceHeatmap() {
  const maxEntries = Math.max(1, ...ALL_CATEGORIES.map((cat) => ledgerHistory.filter((e) => e.category === cat).length))

  return (
    <div className="space-y-2.5">
      {ALL_CATEGORIES.map((cat) => {
        const entries = ledgerHistory.filter((e) => e.category === cat)
        return (
          <div key={cat} className="flex items-center gap-2 sm:gap-3">
            <span className="w-20 shrink-0 truncate text-xs text-fg-muted sm:w-36" title={cat}>
              {cat}
            </span>
            <div className="flex flex-1 flex-wrap gap-1">
              {entries.length === 0
                ? Array.from({ length: 3 }).map((_, i) => (
                    <span key={i} className="h-4 w-4 shrink-0 rounded-sm border border-dashed border-border" />
                  ))
                : entries.map((e) => (
                    <span
                      key={e.submissionId}
                      title={`${e.submissionId} — ${e.verdict}: ${e.outcome}`}
                      className={`h-4 w-4 shrink-0 rounded-sm ${toneDot[verdictTone(e.verdict)]} ${e.humanCorrected ? 'ring-2 ring-fg/40' : ''}`}
                    />
                  ))}
              {entries.length === 0 && <span className="self-center text-[11px] text-fg-subtle">no data yet</span>}
            </div>
            <span className="hidden shrink-0 text-right font-mono text-[11px] text-fg-subtle sm:inline sm:w-16">
              {entries.length}/{maxEntries}
            </span>
          </div>
        )
      })}

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3 text-[11px] text-fg-subtle sm:gap-4">
        <Legend tone="teal" label="Confirmed safe" />
        <Legend tone="amber" label="Still inconclusive" />
        <Legend tone="red" label="Confirmed problem" />
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-fg-subtle ring-2 ring-fg/40" />
          Human-corrected
        </span>
      </div>
    </div>
  )
}

function Legend({ tone, label }: { tone: 'teal' | 'amber' | 'red'; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded-sm ${toneDot[tone]}`} />
      {label}
    </span>
  )
}

function ActivityFeed() {
  const entries: LedgerEntry[] = [...ledgerHistory].reverse().slice(0, 10)
  return (
    <ul className="flex-1 space-y-3 overflow-y-auto">
      {entries.map((e) => (
        <li key={e.submissionId} className="flex gap-2.5 border-b border-border pb-3 last:border-0 last:pb-0">
          <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${toneDot[verdictTone(e.verdict)]}`} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-fg">{e.submissionId}</span>
              <span className="truncate text-[11px] text-fg-subtle">{e.category}</span>
            </div>
            <p className="mt-0.5 truncate text-xs text-fg-muted" title={e.outcome}>
              {e.outcome}
            </p>
          </div>
        </li>
      ))}
    </ul>
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
    <GlassCard className="p-4">
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
        <div
          className="h-full rounded-full bg-amber shadow-[0_0_8px_rgba(210,153,34,0.5)]"
          style={{ width: `${samplePct}%` }}
        />
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
                className="flex items-center gap-1.5 rounded-md border border-border bg-surface-raised px-3 py-2 text-xs font-medium text-fg hover:bg-surface-hover"
              >
                <Check size={13} />
                Approve
              </button>
              <button
                onClick={() => onVerdict('rejected')}
                className="flex items-center gap-1.5 rounded-md border border-border bg-surface-raised px-3 py-2 text-xs font-medium text-fg hover:bg-surface-hover"
              >
                <X size={13} />
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </GlassCard>
  )
}

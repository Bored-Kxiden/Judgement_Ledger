import { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle, CheckCircle2, Clock, GitBranch, GitCommitHorizontal,
  Inbox, Loader2, RefreshCw,
} from 'lucide-react'
import { Avatar } from '../components/Avatar'
import { StatusBadge } from '../components/StatusBadge'
import { fetchApprovals, respondToApproval } from '../lib/api'
import type { ApprovalRequest } from '../lib/api'

export default function EscalationPage() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      setApprovals(await fetchApprovals('pending'))
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load approvals')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <AlertTriangle size={18} className="text-amber-emphasis" />
        <h1 className="text-xl font-semibold">Escalated for human review</h1>
        {!loading && (
          <span className="rounded-full border border-border px-2 py-0.5 text-xs text-fg-muted">
            {approvals.length} pending
          </span>
        )}
        <button
          onClick={() => void load()}
          disabled={loading}
          className="ml-auto flex items-center gap-1.5 rounded-md border border-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-fg hover:bg-surface-hover disabled:opacity-60"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 rounded-md border border-border bg-surface p-6 text-sm text-fg-muted">
          <Loader2 size={16} className="animate-spin text-amber-emphasis" />
          Loading pending approvals…
        </div>
      ) : loadError ? (
        <div className="flex gap-3 rounded-md border border-red/40 bg-red-subtle p-4">
          <AlertTriangle size={18} className="shrink-0 text-red-emphasis" />
          <div>
            <div className="text-sm font-semibold text-fg">Couldn't load approvals</div>
            <div className="mt-0.5 text-xs text-fg-muted">{loadError}</div>
          </div>
        </div>
      ) : approvals.length === 0 ? (
        <div className="rounded-md border border-border bg-surface p-8 text-center">
          <Inbox size={28} className="mx-auto text-fg-subtle" />
          <div className="mt-3 text-sm font-medium text-fg">Nothing waiting on you</div>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-fg-muted">
            When the Threshold Agent escalates a deploy, it appears here with its reasoning and the
            options it wants a decision on. Nothing auto-approves on a timeout.
          </p>
        </div>
      ) : (
        approvals.map((approval) => (
          <ApprovalCard key={approval.request_id} approval={approval} onDecided={load} />
        ))
      )}
    </div>
  )
}

function ApprovalCard({ approval, onDecided }: { approval: ApprovalRequest; onDecided: () => void }) {
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [override, setOverride] = useState('')

  async function decide(decision: { selectedOptionId?: string; overrideMessage?: string }, busyKey: string) {
    setSubmitting(busyKey)
    setError(null)
    try {
      const { alreadyAnswered } = await respondToApproval(approval.request_id, decision)
      if (alreadyAnswered) setError('This request had already been answered. Refreshing.')
      onDecided()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit decision')
    } finally {
      setSubmitting(null)
    }
  }

  const sub = approval.submission

  return (
    <div className="rounded-md border border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-fg">{approval.title ?? 'Approval requested'}</span>
          {sub?.category && <StatusBadge tone="amber">{sub.category}</StatusBadge>}
          <span className="ml-auto font-mono text-xs text-fg-subtle">
            {sub?.id ?? approval.request_id.slice(0, 8)}
          </span>
        </div>

        {sub && (
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Avatar initials={initialsOf(sub.author)} size={20} />
              <span className="text-fg-muted">{sub.author}</span>
            </div>
            <div className="text-fg-muted">
              service <span className="font-mono text-fg">{sub.service}</span>
            </div>
            {sub.branch && (
              <div className="flex items-center gap-1.5 text-fg-muted">
                <GitBranch size={14} />
                <span className="font-mono text-xs">{sub.branch}</span>
              </div>
            )}
            {sub.commit_ref && (
              <div className="flex items-center gap-1.5 text-fg-muted">
                <GitCommitHorizontal size={14} />
                <span className="font-mono text-xs">{sub.commit_ref}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {approval.description && (
        <div className="border-b border-border px-4 py-4">
          <div className="mb-2 text-xs uppercase tracking-wide text-fg-subtle">Agent reasoning</div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">{approval.description}</p>
        </div>
      )}

      <div className="space-y-3 px-4 py-4">
        <div className="flex items-center gap-2 text-xs text-fg-subtle">
          <Clock size={13} />
          Blocked until reviewed — no automatic timeout approval.
        </div>

        <div className="flex flex-wrap gap-2">
          {approval.options.map((option) => (
            <button
              key={option.option_id}
              onClick={() => void decide({ selectedOptionId: option.option_id }, option.option_id)}
              disabled={submitting !== null}
              title={option.description}
              className="flex items-center gap-2 rounded-md border border-border bg-surface-raised px-4 py-2.5 text-sm font-medium text-fg hover:bg-surface-hover disabled:opacity-60"
            >
              {submitting === option.option_id ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <CheckCircle2 size={15} className="text-teal-emphasis" />
              )}
              {option.title}
            </button>
          ))}
        </div>

        <div>
          <textarea
            value={override}
            onChange={(e) => setOverride(e.target.value)}
            placeholder="Or write your own response instead of picking an option…"
            rows={2}
            className="w-full rounded-md border border-border bg-canvas-inset px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:border-amber focus:outline-none"
          />
          <button
            onClick={() => void decide({ overrideMessage: override.trim() }, '__override__')}
            disabled={submitting !== null || override.trim().length === 0}
            className="mt-2 flex items-center gap-2 rounded-md border border-amber/40 bg-amber-subtle px-3 py-1.5 text-xs font-medium text-amber-emphasis disabled:opacity-40"
          >
            {submitting === '__override__' && <Loader2 size={13} className="animate-spin" />}
            Send custom response
          </button>
        </div>

        {error && (
          <div className="flex gap-2 rounded-md border border-red/40 bg-red-subtle p-3">
            <AlertTriangle size={15} className="shrink-0 text-red-emphasis" />
            <span className="text-xs text-fg-muted">{error}</span>
          </div>
        )}

        {approval.workflow_run_id && (
          <div className="font-mono text-[11px] text-fg-subtle">run {approval.workflow_run_id}</div>
        )}
      </div>
    </div>
  )
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

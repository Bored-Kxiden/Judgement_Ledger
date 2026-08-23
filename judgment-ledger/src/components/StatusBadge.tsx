type Tone = 'amber' | 'teal' | 'red' | 'blue' | 'neutral'

const toneClasses: Record<Tone, string> = {
  amber: 'bg-amber-subtle text-amber-emphasis border-amber/40',
  teal: 'bg-teal-subtle text-teal-emphasis border-teal/40',
  red: 'bg-red-subtle text-red-emphasis border-red/40',
  blue: 'bg-blue-subtle text-blue border-blue/40',
  neutral: 'bg-surface-raised text-fg-muted border-border',
}

export function StatusBadge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${toneClasses[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  )
}

export function verdictTone(verdict: string): Tone {
  if (verdict.startsWith('confirmed safe')) return 'teal'
  if (verdict.startsWith('confirmed problem')) return 'red'
  if (verdict === 'still inconclusive') return 'amber'
  return 'neutral'
}

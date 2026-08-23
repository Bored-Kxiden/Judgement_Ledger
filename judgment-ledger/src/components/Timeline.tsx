import type { LucideIcon } from 'lucide-react'

type StepTone = 'blue' | 'amber' | 'teal' | 'red' | 'neutral'

const toneRing: Record<StepTone, string> = {
  blue: 'bg-blue text-canvas-inset',
  amber: 'bg-amber text-canvas-inset',
  teal: 'bg-teal text-canvas-inset',
  red: 'bg-red text-canvas-inset',
  neutral: 'bg-surface-raised text-fg-subtle border border-border',
}

export function Timeline({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col">{children}</div>
}

export function TimelineStep({
  icon: Icon,
  tone,
  time,
  title,
  meta,
  children,
  isLast = false,
  pending = false,
}: {
  icon: LucideIcon
  tone: StepTone
  time?: string
  title: string
  meta?: string
  children?: React.ReactNode
  isLast?: boolean
  pending?: boolean
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        {time !== undefined && (
          <span className="mb-1.5 font-mono text-[11px] text-fg-subtle">{time}</span>
        )}
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${toneRing[tone]} ${pending ? 'animate-pulse opacity-60' : ''}`}
        >
          <Icon size={16} strokeWidth={2.25} />
        </span>
        {!isLast && <span className="mt-1 w-px flex-1 bg-border" style={{ minHeight: 24 }} />}
      </div>

      <div className={`flex-1 pb-6 ${pending ? 'opacity-60' : ''}`}>
        <div className="rounded-lg border border-border bg-surface-raised/70 px-4 py-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium text-fg">{title}</span>
            {meta && <span className="shrink-0 font-mono text-[11px] text-fg-subtle">{meta}</span>}
          </div>
          {children && <div className="mt-1 text-xs leading-relaxed text-fg-muted">{children}</div>}
        </div>
      </div>
    </div>
  )
}

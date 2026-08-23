import { FileDiff } from 'lucide-react'
import type { DiffFile } from '../data/mockData'

function DiffLine({ type, content }: { type: 'context' | 'add' | 'remove'; content: string }) {
  const prefix = type === 'add' ? '+' : type === 'remove' ? '-' : ' '
  const bg =
    type === 'add' ? 'bg-teal-subtle' : type === 'remove' ? 'bg-red-subtle' : ''
  const fg =
    type === 'add' ? 'text-teal-emphasis' : type === 'remove' ? 'text-red-emphasis' : 'text-fg-muted'
  return (
    <div className={`flex ${bg}`}>
      <span className={`w-6 shrink-0 select-none text-center ${fg}`}>{prefix}</span>
      <span className="whitespace-pre-wrap break-all text-fg">{content}</span>
    </div>
  )
}

export function DiffView({ file }: { file: DiffFile }) {
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-2">
        <FileDiff size={14} className="text-fg-subtle" />
        <span className="font-mono text-sm text-fg">{file.filename}</span>
        <span className="ml-auto rounded-full border border-border px-2 py-0.5 text-[11px] uppercase tracking-wide text-fg-subtle">
          {file.status}
        </span>
      </div>
      {file.hunks.length === 0 ? (
        <div className="px-3 py-3 font-mono text-xs text-fg-subtle">No diff preview available.</div>
      ) : (
        <div className="bg-canvas-inset font-mono text-[13px] leading-[1.6]">
          {file.hunks.map((hunk, i) => (
            <div key={i}>
              <div className="bg-blue-subtle px-3 py-1 text-blue">{hunk.header}</div>
              <div>
                {hunk.lines.map((line, j) => (
                  <div key={j} className="px-1">
                    <DiffLine type={line.type} content={line.content} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

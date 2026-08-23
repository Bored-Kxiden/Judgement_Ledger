import { NavLink } from 'react-router-dom'
import { Scale, FileText, ShieldAlert, ClipboardCheck, ChevronRight, Search, Bell } from 'lucide-react'
import { Avatar } from './Avatar'

const tabs = [
  { to: '/', label: 'Submit', icon: FileText, end: true },
  { to: '/escalation', label: 'Escalations', icon: ShieldAlert },
  { to: '/policy-review', label: 'Policy Review', icon: ClipboardCheck },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas text-fg">
      <header className="border-b border-border-muted bg-canvas-inset">
        <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-4 py-3">
          <Scale size={22} className="text-amber-emphasis" strokeWidth={2} />
          <div className="flex items-center gap-1.5 font-mono text-[15px]">
            <span className="text-fg-muted">org-eng</span>
            <ChevronRight size={14} className="text-fg-subtle" />
            <span className="font-semibold">judgment-ledger</span>
          </div>
          <span className="ml-1 rounded-full border border-border px-2 py-0.5 text-xs text-fg-muted">
            deploy governance
          </span>

          <div className="ml-auto flex items-center gap-4">
            <div className="hidden items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-fg-subtle sm:flex">
              <Search size={14} />
              <span>Search submissions…</span>
              <kbd className="ml-6 rounded border border-border-muted bg-surface-raised px-1.5 py-0.5 font-mono text-[10px] text-fg-subtle">
                /
              </kbd>
            </div>
            <button className="relative text-fg-muted hover:text-fg">
              <Bell size={18} />
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red" />
            </button>
            <Avatar initials="PA" size={28} />
          </div>
        </div>

        <nav className="mx-auto flex max-w-[1280px] gap-1 px-4">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-amber text-fg'
                    : 'border-transparent text-fg-muted hover:border-border hover:text-fg'
                }`
              }
            >
              <t.icon size={16} />
              {t.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-6">{children}</main>
    </div>
  )
}

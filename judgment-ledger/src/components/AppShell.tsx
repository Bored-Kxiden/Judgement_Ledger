import { NavLink } from 'react-router-dom'
import { Scale, FileText, ShieldAlert, ClipboardCheck, ChevronRight } from 'lucide-react'
import { Avatar } from './Avatar'

const tabs = [
  { to: '/', label: 'Submit', icon: FileText, end: true },
  { to: '/escalation', label: 'Escalations', icon: ShieldAlert },
  { to: '/policy-review', label: 'Policy Review', icon: ClipboardCheck },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-canvas text-fg">
      <div className="bg-orbs">
        <div className="bg-orb bg-orb--amber" />
        <div className="bg-orb bg-orb--teal" />
        <div className="bg-orb bg-orb--red" />
      </div>

      <header className="glass sticky top-0 z-10 border-x-0 border-t-0">
        <div className="mx-auto flex max-w-[1280px] items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4">
          <Scale size={20} className="shrink-0 text-amber-emphasis" strokeWidth={2} />
          <div className="flex min-w-0 items-center gap-1.5 font-mono text-sm sm:text-[15px]">
            <span className="hidden text-fg-muted sm:inline">org-eng</span>
            <ChevronRight size={14} className="hidden shrink-0 text-fg-subtle sm:inline" />
            <span className="truncate font-semibold">judgment-ledger</span>
          </div>
          <span className="ml-1 hidden shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-fg-muted md:inline-block">
            deploy governance
          </span>

          <div className="ml-auto flex shrink-0 items-center">
            <Avatar initials="PA" size={28} />
          </div>
        </div>

        <nav className="mx-auto flex max-w-[1280px] gap-1 overflow-x-auto px-3 sm:px-4">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
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

      <main className="relative z-[1] mx-auto max-w-[1280px] px-3 py-5 sm:px-4 sm:py-6">{children}</main>
    </div>
  )
}

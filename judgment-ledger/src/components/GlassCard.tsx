export function GlassCard({
  children,
  className = '',
  hover = false,
  strong = false,
}: {
  children: React.ReactNode
  className?: string
  hover?: boolean
  strong?: boolean
}) {
  return (
    <div
      className={`rounded-xl ${strong ? 'glass-strong' : 'glass'} ${hover ? 'glass-hover' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

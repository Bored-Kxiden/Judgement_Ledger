const PALETTE = ['#d29922', '#2dd4bf', '#58a6ff', '#f778ba', '#a371f7']

function hashString(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

export function Avatar({ initials, size = 28 }: { initials: string; size?: number }) {
  const color = PALETTE[hashString(initials) % PALETTE.length]
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-mono font-semibold text-canvas"
      style={{ width: size, height: size, fontSize: size * 0.38, backgroundColor: color }}
    >
      {initials}
    </span>
  )
}

type Variant = 'light' | 'dark'

const COLORS = {
  light: { tile: '#E2725B', key: '#0E4D5C', hole: '#F4EDE1' },
  dark: { tile: '#0B2730', key: '#E2725B', hole: '#0B2730' },
}

/** The "Flip" key glyph only (no tile). Used inside tiles that supply their own background. */
export function KeyGlyph({ size, keyColor = '#0E4D5C', hole = '#F4EDE1' }: { size: number; keyColor?: string; hole?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <g transform="rotate(-18 50 50)">
        <path d="M50 8L80 32V56H20V32Z" fill={keyColor} stroke={keyColor} strokeWidth="6" strokeLinejoin="round" />
        <circle cx="50" cy="33" r="6" fill={hole} />
        <path d="M47 35H53L55 47H45Z" fill={hole} />
        <rect x="43" y="52" width="14" height="40" rx="4" fill={keyColor} />
        <rect x="53" y="68" width="16" height="9" rx="2.5" fill={keyColor} />
        <rect x="53" y="81" width="11" height="9" rx="2.5" fill={keyColor} />
      </g>
    </svg>
  )
}

export function LogoTile({ size = 34, variant = 'light' }: { size?: number; variant?: Variant }) {
  const c = COLORS[variant]
  return (
    <span
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.27), background: c.tile, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
    >
      <KeyGlyph size={Math.round(size * 0.76)} keyColor={c.key} hole={c.hole} />
    </span>
  )
}

export function Wordmark({ size = 20 }: { size?: number }) {
  return <span style={{ fontSize: size, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>keyly</span>
}

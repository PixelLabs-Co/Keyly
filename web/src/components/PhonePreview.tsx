import './PhonePreview.css'

export const BRAND_COLORS = [
  { name: 'Keyly Teal', hex: '#0E4D5C' },
  { name: 'Navy', hex: '#1B2A4A' },
  { name: 'Forest', hex: '#1F4D3A' },
  { name: 'Burgundy', hex: '#6B2235' },
  { name: 'Plum', hex: '#4A2C5E' },
  { name: 'Charcoal', hex: '#2E2E2E' },
]

type Props = {
  color: string
  name: string
  brokerage: string
  headshotUrl?: string | null
  address?: string
  note?: string
  large?: boolean // the bigger mockup on Preview & send
  hideAddress?: boolean
}

/** Buyer welcome screen mockup. Reused on Brand setup and Preview & send. */
export default function PhonePreview({ color, name, brokerage, headshotUrl, address, note, large, hideAddress }: Props) {
  return (
    <div className={`phone${large ? ' large' : ''}`}>
      <div className="phone-hero" style={{ background: color }}>
        <p className="phone-gift">A gift from</p>
        <div className="phone-agent">
          <span className="phone-avatar">
            {headshotUrl ? <img src={headshotUrl} alt="" /> : (
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="8.5" r="3.6" fill="none" stroke={color} strokeWidth="2" />
                <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </span>
          <span className="phone-who">
            <span className="phone-name">{name || '[Your name]'}</span>
            <span className="phone-brok">{brokerage || '[Brokerage]'}</span>
          </span>
        </div>
      </div>
      <div className="phone-body">
        <p className="phone-welcome">Welcome home.</p>
        {note !== undefined ? (
          <div className="phone-note">
            <p>“{note || 'Your personal note will appear here.'}”</p>
            <span>{name || '[Your name]'}</span>
          </div>
        ) : null}
        {!hideAddress && <p className="phone-addr">{address || '[Home address]'}</p>}
        <div style={{ flex: 1 }} />
        <div className="phone-apple">Continue with Apple</div>
      </div>
    </div>
  )
}

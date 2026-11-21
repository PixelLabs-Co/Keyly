import { useEffect, useId, useRef, useState } from 'react'
import { newSessionToken, placesEnabled, suggestAddresses, type Suggestion } from '../lib/places'
import './AddressInput.css'

type Props = { id?: string; value: string; onChange: (v: string) => void; placeholder?: string }

/** Address field with Google Places suggestions. Falls back to a plain input when no key is set or Google fails. */
export default function AddressInput({ id, value, onChange, placeholder }: Props) {
  const [items, setItems] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const token = useRef<string | null>(null)
  const timer = useRef<number>(undefined)
  const justPicked = useRef(false)
  const listId = useId()

  useEffect(() => {
    if (!placesEnabled || justPicked.current) { justPicked.current = false; return }
    window.clearTimeout(timer.current)
    if (value.trim().length < 3) { setItems([]); return }
    timer.current = window.setTimeout(async () => {
      try {
        token.current ??= newSessionToken()
        const res = await suggestAddresses(value, token.current)
        setItems(res); setActive(-1); setOpen(res.length > 0)
      } catch { setItems([]); setOpen(false) } // fall back to typing freely
    }, 250)
    return () => window.clearTimeout(timer.current)
  }, [value])

  const pick = (s: Suggestion) => {
    justPicked.current = true
    onChange(s.text); setOpen(false); setItems([]); token.current = null // new billing session after a pick
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % items.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a <= 0 ? items.length - 1 : a - 1)) }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(items[active]) }
    else if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="addr">
      <input
        id={id} className="input" value={value} placeholder={placeholder} autoComplete="off"
        role={placesEnabled ? 'combobox' : undefined}
        aria-expanded={placesEnabled ? open : undefined} aria-controls={placesEnabled ? listId : undefined}
        aria-autocomplete={placesEnabled ? 'list' : undefined}
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        onChange={(e) => onChange(e.target.value)} onKeyDown={onKey}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onFocus={() => items.length > 0 && setOpen(true)}
      />
      {open && (
        <ul id={listId} role="listbox" className="addr-list">
          {items.map((s, i) => (
            <li key={s.text} id={`${listId}-${i}`} role="option" aria-selected={i === active}
              className={i === active ? 'on' : ''} onMouseDown={(e) => { e.preventDefault(); pick(s) }}>
              <strong>{s.main}</strong><span>{s.secondary}</span>
            </li>
          ))}
          <li className="addr-attr" aria-hidden="true">powered by Google</li>
        </ul>
      )}
    </div>
  )
}

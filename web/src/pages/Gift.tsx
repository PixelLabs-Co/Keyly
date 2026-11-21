import { LogoTile, Wordmark } from '../components/Logo'

/** Landing page for invite links. The buyer experience itself lives in the iPhone app (built later). */
export default function Gift() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--teal)', color: 'var(--cream)', textAlign: 'center' }}>
      <div style={{ maxWidth: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><LogoTile size={44} /><Wordmark size={28} /></div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: -1 }}>Your gift is waiting.</h1>
        <p style={{ margin: 0, color: '#CFE3DF', lineHeight: 1.5 }}>Your Keyly home app opens on iPhone. It’s almost ready. Your agent will let you know when you can download it.</p>
      </div>
    </main>
  )
}

export default function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <div>
      <h1 className="page-title">{title}</h1>
      <p className="muted">{note}</p>
    </div>
  )
}

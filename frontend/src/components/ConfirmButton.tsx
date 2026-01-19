'use client'
export default function ConfirmButton({ onConfirm, children }: { onConfirm: () => void; children: React.ReactNode }) {
  const click = () => {
    if (confirm("Are you sure?")) onConfirm()
  }
  return <button className="px-3 py-1 border rounded" onClick={click}>{children}</button>
}

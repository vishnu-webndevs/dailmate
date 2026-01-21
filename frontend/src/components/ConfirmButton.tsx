'use client'
export default function ConfirmButton({ onConfirm, children, className }: { onConfirm: () => void; children: React.ReactNode; className?: string }) {
  const click = () => {
    if (confirm("Are you sure?")) onConfirm()
  }
  return <button className={className || "px-3 py-1 border rounded"} onClick={click}>{children}</button>
}

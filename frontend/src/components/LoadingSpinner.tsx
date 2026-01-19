'use client'
export default function LoadingSpinner({ show }: { show?: boolean }) {
  if (!show) return null
  return <div className="animate-pulse text-zinc-500">Loading...</div>
}

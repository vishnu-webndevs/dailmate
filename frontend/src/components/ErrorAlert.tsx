'use client'
export default function ErrorAlert({ error }: { error?: string }) {
  if (!error) return null
  return <p className="text-red-600">{error}</p>
}

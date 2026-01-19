'use client'
import { useEffect, useState } from "react";

type CallRow = {
  id: string
  from?: string
  to?: string
  status: string
  startedAt: string
  endedAt?: string
  recordingUrl?: string
}

export default function History() {
  const [rows, setRows] = useState<CallRow[]>([])
  const [error, setError] = useState<string>("")
  useEffect(() => {
    const token = localStorage.getItem("jwt") || ""
    fetch("/api/history", { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => {
        if (!r.ok) { setError(`Error ${r.status}`); return [] }
        return await r.json()
      })
      .then(setRows)
      .catch(() => setError("unavailable"))
  }, [])
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Call History</h1>
      {error && <p className="text-red-600">{error}</p>}
      <ul className="mt-4 space-y-2">
        {rows.map(r => (
          <li key={r.id} className="border p-2">
            <div>ID: {r.id}</div>
            <div>Status: {r.status}</div>
            <div>Started: {r.startedAt}</div>
            {r.recordingUrl && <a href={r.recordingUrl} className="underline text-blue-600">Recording</a>}
          </li>
        ))}
        {rows.length === 0 && <li>No history</li>}
      </ul>
    </main>
  )
}

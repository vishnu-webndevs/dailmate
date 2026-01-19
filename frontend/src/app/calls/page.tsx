'use client'
import { useEffect, useState } from "react";
import ConfirmButton from "../../components/ConfirmButton";
import ErrorAlert from "../../components/ErrorAlert";
import PageHeader from "../../components/PageHeader";
import { apiGet, apiPostJson } from "../../lib/api";

type CallRecord = {
  id: string
  from?: string
  to?: string
  status: "starting" | "live" | "ended"
  startedAt: string
  endedAt?: string
}

export default function Calls() {
  const [calls, setCalls] = useState<CallRecord[]>([])
  const [error, setError] = useState<string>("")
  const load = () => {
    apiGet<CallRecord[]>("http://localhost:3000/calls/live").then(setCalls).catch((e) => setError(String(e)))
  }
  useEffect(() => {
    load()
    const t = setInterval(load, 3000)
    return () => clearInterval(t)
  }, [])
  const hangup = async (id: string) => {
    try {
      await apiPostJson(`http://localhost:3000/calls/${id}/hangup`, {})
      load()
    } catch (e) {
      setError(String(e))
    }
  }
  return (
    <main className="p-8">
      <PageHeader title="Live Calls" />
      <ErrorAlert error={error} />
      <ul className="mt-4 space-y-2">
        {calls.map(c => (
          <li key={c.id} className="border p-2">
            <div>ID: {c.id}</div>
            <div>Status: {c.status}</div>
            <div>Started: {c.startedAt}</div>
            <div>Duration: {durationSince(c.startedAt)}s</div>
            <div className="mt-2">
              <ConfirmButton onConfirm={() => hangup(c.id)}>Hangup</ConfirmButton>
            </div>
          </li>
        ))}
        {calls.length === 0 && <li>No live calls</li>}
      </ul>
    </main>
  )
}

function durationSince(startedAt: string) {
  const s = new Date(startedAt).getTime()
  return Math.max(0, Math.floor((Date.now() - s) / 1000))
}

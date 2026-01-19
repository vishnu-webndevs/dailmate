'use client'
import { useEffect, useState } from "react"
import MetricCard from "../../components/MetricCard"
import ErrorAlert from "../../components/ErrorAlert"
import PageHeader from "../../components/PageHeader"
import { apiGet, API_BASE } from "../../lib/api"

type Overview = { calls: Record<string, number>; live: number; sms: number }

export default function Dashboard() {
  const [data, setData] = useState<Overview | null>(null)
  const [error, setError] = useState<string>("")
  useEffect(() => {
    apiGet<Overview>("http://localhost:3000/analytics/overview")
      .then(setData)
      .catch((e) => setError(String(e)))
  }, [])
  const totalCalls = data ? Object.values(data.calls).reduce((a, b) => a + b, 0) : 0
  return (
    <main className="p-2">
      <PageHeader title="Dashboard" actions={<div className="flex gap-2"><a href="/campaigns" className="px-4 py-2 border rounded">Start Batch Call</a><a href="/calls" className="px-4 py-2 border rounded">View Live Calls</a></div>} />
      <ErrorAlert error={error} />
      <div className="grid grid-cols-4 gap-4 mt-4">
        <MetricCard title="Total Calls" value={totalCalls} />
        <MetricCard title="Live Calls" value={data?.live ?? 0} />
        <MetricCard title="SMS Sent" value={data?.sms ?? 0} />
        <MetricCard title="Health" value={<QuickHealth />} />
      </div>
    </main>
  )
}

function QuickHealth() {
  const [h, setH] = useState<string>("")
  useEffect(() => {
    fetch(`${API_BASE}/health`).then(r => r.json()).then(d => setH(JSON.stringify(d))).catch(() => setH("unavailable"))
  }, [])
  return <div className="text-sm">{h}</div>
}

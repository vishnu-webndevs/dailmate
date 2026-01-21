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
    apiGet<Overview>("/api/analytics/overview")
      .then(setData)
      .catch((e) => setError(String(e)))
  }, [])
  const totalCalls = data ? Object.values(data.calls).reduce((a, b) => a + b, 0) : 0
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard Overview" 
        actions={
          <div className="flex gap-3">
            <a href="/campaigns" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
              Start Batch Call
            </a>
            <a href="/calls" className="px-4 py-2 bg-white text-gray-700 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
              View Live Calls
            </a>
          </div>
        } 
      />
      <ErrorAlert error={error} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Calls" value={totalCalls} />
        <MetricCard title="Live Calls" value={data?.live ?? 0} />
        <MetricCard title="SMS Sent" value={data?.sms ?? 0} />
        <MetricCard title="System Health" value={<QuickHealth />} />
      </div>
    </div>
  )
}

function QuickHealth() {
  const [h, setH] = useState<string>("...")
  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then(r => r.json())
      .then(d => setH(d.ok && d.db ? "Healthy" : "Issues"))
      .catch(() => setH("Offline"))
  }, [])
  
  const getColor = () => {
    if (h === "Healthy") return "text-green-600 bg-green-50 px-2 py-1 rounded-full text-sm font-medium"
    if (h === "Offline") return "text-red-600 bg-red-50 px-2 py-1 rounded-full text-sm font-medium"
    return "text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full text-sm font-medium"
  }

  return <span className={getColor()}>{h}</span>
}

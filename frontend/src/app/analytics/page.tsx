'use client'
import { useEffect, useState } from "react";
import MetricCard from "../../components/MetricCard"
import ErrorAlert from "../../components/ErrorAlert"
import PageHeader from "../../components/PageHeader"
import LoadingSpinner from "../../components/LoadingSpinner"
import { apiGet } from "../../lib/api"

type Overview = { calls: Record<string, number>; live: number; sms: number }

export default function Analytics() {
  const [data, setData] = useState<Overview | null>(null)
  const [error, setError] = useState<string>("")
  useEffect(() => {
    apiGet<Overview>("/api/analytics/overview").then(setData).catch((e) => setError(String(e)))
  }, [])
  return (
    <main className="p-8">
      <PageHeader title="Analytics Overview" />
      <ErrorAlert error={error} />
      <LoadingSpinner show={!data && !error} />
      {data && (
        <>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <MetricCard title="Live Calls" value={data.live} />
            <MetricCard title="SMS Total" value={data.sms} />
            <MetricCard title="Calls Count" value={Object.values(data.calls).reduce((a, b) => a + b, 0)} />
          </div>
          <div className="mt-6">
            <h2 className="text-lg font-semibold">Calls by Status</h2>
            <ul className="list-disc ml-6">
              {Object.entries(data.calls).map(([k, v]) => <li key={k}>{k}: {v}</li>)}
              {Object.keys(data.calls).length === 0 && <li>None</li>}
            </ul>
          </div>
        </>
      )}
    </main>
  )
}

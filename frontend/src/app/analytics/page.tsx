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
    <div className="space-y-6">
      <PageHeader title="Analytics Overview" />
      <ErrorAlert error={error} />
      <LoadingSpinner show={!data && !error} />
      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard title="Live Calls" value={data.live} />
            <MetricCard title="SMS Sent" value={data.sms} />
            <MetricCard title="Total Calls" value={Object.values(data.calls).reduce((a, b) => a + b, 0)} />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Call Status Distribution</h2>
              {Object.keys(data.calls).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(data.calls).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="font-medium text-gray-700 capitalize">{k}</span>
                      <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-sm font-semibold">
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">No call data available</div>
              )}
            </div>
            
            {/* Placeholder for future charts or more detailed stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-center text-gray-400 min-h-[200px]">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                <p>Additional charts coming soon</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

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
    apiGet<CallRecord[]>("/api/calls/live").then(setCalls).catch((e) => setError(String(e)))
  }
  useEffect(() => {
    load()
    const t = setInterval(load, 3000)
    return () => clearInterval(t)
  }, [])
  const hangup = async (id: string) => {
    try {
      await apiPostJson(`/api/calls/${id}/hangup`, {})
      load()
    } catch (e) {
      setError(String(e))
    }
  }
  return (
    <div className="space-y-6">
      <PageHeader title="Live Calls" />
      <ErrorAlert error={error} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {calls.map(c => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.status === 'live' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {c.status.toUpperCase()}
                </span>
                <span className="text-xs text-gray-400 font-mono">#{c.id.substring(0, 8)}</span>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">From:</span>
                  <span className="font-medium text-gray-900">{c.from || 'Unknown'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">To:</span>
                  <span className="font-medium text-gray-900">{c.to || 'Unknown'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Duration:</span>
                  <span className="font-medium text-gray-900 font-mono">{durationSince(c.startedAt)}s</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <ConfirmButton 
                onConfirm={() => hangup(c.id)}
                className="w-full bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                End Call
              </ConfirmButton>
            </div>
          </div>
        ))}
        {calls.length === 0 && (
          <div className="col-span-full bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg">No active calls at the moment</p>
          </div>
        )}
      </div>
    </div>
  )
}

function durationSince(startedAt: string) {
  const s = new Date(startedAt).getTime()
  return Math.max(0, Math.floor((Date.now() - s) / 1000))
}

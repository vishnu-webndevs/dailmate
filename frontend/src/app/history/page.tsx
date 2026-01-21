'use client'
import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";

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

  const columns: Array<{ key: keyof CallRow; label: string }> = [
    { key: "id", label: "Call ID" },
    { key: "from", label: "From" },
    { key: "to", label: "To" },
    { key: "status", label: "Status" },
    { key: "startedAt", label: "Started At" },
    { key: "recordingUrl", label: "Recording" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Call History" />
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <DataTable<CallRow> 
          rows={rows.map(r => ({
            ...r,
            startedAt: new Date(r.startedAt).toLocaleString(),
            recordingUrl: r.recordingUrl ? (
              <a href={r.recordingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Listen
              </a>
            ) : "-"
          }) as any)} 
          columns={columns} 
          keyField="id" 
        />
      </div>
    </div>
  )
}

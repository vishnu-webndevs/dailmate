"use client"

import { useEffect, useState } from "react"
import { API_BASE } from "@/lib/api"
import PageHeader from "@/components/PageHeader"

export default function DebugAudioPage() {
  const [files, setFiles] = useState<{ name: string, url: string, ts: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/debug/files`)
      .then(res => res.json())
      .then(data => {
        setFiles(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Debug Audio" />

      {loading && <div>Loading...</div>}

      <div className="grid gap-4">
        {files.map(file => (
          <div key={file.name} className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
            <div className="font-mono text-sm">
                <div>{file.name}</div>
                <div className="text-xs text-gray-500">{new Date(file.ts).toLocaleString()}</div>
            </div>
            <audio controls src={file.url} />
          </div>
        ))}
        {files.length === 0 && !loading && (
            <div className="text-gray-500">No debug audio files found. Make a call first!</div>
        )}
      </div>
    </div>
  )
}

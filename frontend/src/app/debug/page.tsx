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
    <div className="space-y-6">
      <PageHeader title="Debug Audio" />

      {loading && (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      <div className="space-y-4">
        {files.map(file => (
          <div key={file.name} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:shadow-md">
            <div className="font-mono text-sm">
                <div className="font-medium text-gray-900 mb-1">{file.name}</div>
                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block">
                  {new Date(file.ts).toLocaleString()}
                </div>
            </div>
            <div className="w-full sm:w-auto">
               <audio controls src={file.url} className="w-full" style={{ minWidth: '250px' }} />
            </div>
          </div>
        ))}
        {files.length === 0 && !loading && (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">No debug audio files found. Make a call first!</p>
            </div>
        )}
      </div>
    </div>
  )
}

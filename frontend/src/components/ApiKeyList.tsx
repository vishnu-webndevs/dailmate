'use client'
import { useEffect, useState } from "react"
import { apiGet } from "../lib/api"
import ErrorAlert from "./ErrorAlert"

type Row = { name: string; preview: string; createdAt: string; updatedAt: string }

export default function ApiKeyList({ refresh }: { refresh?: number }) {
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState("")
  const load = () => {
    apiGet<Row[]>("/api/settings/api-keys").then(setRows).catch((e) => setError(String(e)))
  }
  useEffect(() => { load() }, [refresh])
  
  return (
    <div className="space-y-4">
      <ErrorAlert error={error} />
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preview</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((r) => (
              <tr key={r.name} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono bg-gray-50 rounded px-2">{r.preview || "-"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(r.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500 italic">
                  No custom keys configured yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}


'use client'
import { useEffect, useState } from "react"
import { apiGet } from "../lib/api"
import ErrorAlert from "./ErrorAlert"

type Row = { name: string; preview: string; createdAt: string; updatedAt: string }

export default function ApiKeyList({ refresh }: { refresh?: number }) {
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState("")
  const load = () => {
    apiGet<Row[]>("http://localhost:3000/settings/api-keys").then(setRows).catch((e) => setError(String(e)))
  }
  useEffect(() => { load() }, [refresh])
  return (
    <div className="border p-4 rounded">
      <div className="font-semibold mb-2">Stored API Keys</div>
      <ErrorAlert error={error} />
      <table className="w-full">
        <thead><tr><th className="text-left">Name</th><th className="text-left">Preview</th><th className="text-left">Updated</th></tr></thead>
        <tbody>
          {rows.map((r) => <tr key={r.name}><td className="py-1">{r.name}</td><td className="py-1">{r.preview || "-"}</td><td className="py-1">{new Date(r.updatedAt).toLocaleString()}</td></tr>)}
          {rows.length === 0 && <tr><td className="py-1 text-zinc-500">No keys</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

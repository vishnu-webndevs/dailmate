'use client'
import { useState } from "react";
import PageHeader from "../../components/PageHeader"
import ErrorAlert from "../../components/ErrorAlert"
import { apiPostForm } from "../../lib/api"

export default function Campaigns() {
  const [status, setStatus] = useState<string>("")
  const [error, setError] = useState<string>("")
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    try {
      const data = await apiPostForm<{ total: number; queued: number }>("http://localhost:3000/campaigns/batch-call", fd)
      setStatus(JSON.stringify(data))
    } catch (e) {
      setError(String(e))
    }
  }
  return (
    <main className="p-8">
      <PageHeader title="Batch Call" />
      <ErrorAlert error={error} />
      <form className="mt-4 flex flex-col gap-2" onSubmit={onSubmit}>
        <input className="border p-2" name="file" type="file" accept=".csv" />
        <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">Upload</button>
      </form>
      <p className="mt-4 break-all">{status}</p>
    </main>
  )
}

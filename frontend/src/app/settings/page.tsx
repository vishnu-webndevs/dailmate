'use client'
import PageHeader from "../../components/PageHeader"
import { getRoleFromToken } from "../../lib/auth"
import { useEffect, useState } from "react"
import ErrorAlert from "../../components/ErrorAlert"
import ApiKeyForm from "../../components/ApiKeyForm"
import ApiKeyList from "../../components/ApiKeyList"
import ApiKeyFixedFields from "../../components/ApiKeyFixedFields"
import { API_BASE } from "../../lib/api"

export default function Settings() {
  const [role, setRole] = useState<string>("")
  const [health, setHealth] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [refreshCount, setRefreshCount] = useState<number>(0)
  useEffect(() => {
    const r = getRoleFromToken()
    setTimeout(() => setRole(r), 0)
    fetch(`${API_BASE}/health`).then(r => r.json()).then(d => setHealth(JSON.stringify(d))).catch((e) => setError(String(e)))
  }, [])
  const logoutAll = () => {
    alert("This would invalidate all sessions (UI only).")
  }
  return (
    <main>
      <PageHeader title="Settings" />
      <ErrorAlert error={error} />
      <div className="mt-4 space-y-4">
        <div className="border p-4">
          <div className="font-semibold">Profile</div>
          <div>Role: {role || "guest"}</div>
        </div>
        <div className="border p-4">
          <div className="font-semibold">Security</div>
          <button className="px-3 py-1 border rounded" onClick={logoutAll}>Logout all sessions</button>
        </div>
        <div className="border p-4">
          <div className="font-semibold">API Status</div>
          <div className="break-all">{health}</div>
        </div>
        {role === "admin" && (
          <div className="space-y-4">
            <ApiKeyFixedFields />
            <ApiKeyForm onSaved={() => setRefreshCount((c) => c + 1)} />
            <ApiKeyList refresh={refreshCount} />
          </div>
        )}
      </div>
    </main>
  )
}

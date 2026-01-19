'use client'
import { useState } from "react";
import { API_BASE } from "../../lib/api";
import { clearSessionCookie, setSessionCookie } from "../../lib/auth";
 
export default function Login() {
  const [email, setEmail] = useState("admin@example.com")
  const [password, setPassword] = useState("secret")
  const [token, setToken] = useState<string>("")
  const [message] = useState<string>(() => {
    if (typeof window === "undefined") return ""
    clearSessionCookie()
    try {
      const url = new URL(window.location.href)
      const expired = url.searchParams.get("expired") === "1"
      const expiredFlag = localStorage.getItem("sessionExpired") === "1"
      localStorage.removeItem("sessionExpired")
      if (expired || expiredFlag) {
        return "Your session has ended. Please log in again to continue."
      }
      return ""
    } catch {
      return ""
    }
  })
  const [redirectTo] = useState<string>(() => {
    if (typeof window === "undefined") return "/dashboard"
    try {
      const url = new URL(window.location.href)
      const next = url.searchParams.get("next") || ""
      const storedNext = localStorage.getItem("postLoginRedirect") || ""
      return next || storedNext || "/dashboard"
    } catch {
      return "/dashboard"
    }
  })

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    setToken(data.access_token || "")
    localStorage.setItem("jwt", data.access_token || "")
    if (data.refresh_token) localStorage.setItem("refresh", data.refresh_token)
    if (data.access_token) {
      setSessionCookie()
      try {
        localStorage.removeItem("postLoginRedirect")
      } catch {
        void 0
      }
      const target = redirectTo || "/dashboard"
      window.location.href = target
    }
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Login</h1>
      {message && <p className="mt-2 text-red-600">{message}</p>}
      <form className="mt-4 flex flex-col gap-2" onSubmit={onSubmit}>
        <input className="border p-2" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
        <input className="border p-2" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" />
        <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">Login</button>
      </form>
      <p className="mt-4 break-all">Token: {token}</p>
    </main>
  )
}

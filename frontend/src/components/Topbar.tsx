'use client'
import { useEffect, useState } from "react"
import { getRoleFromToken, getToken } from "../lib/auth"

export default function Topbar() {
  const [role, setRole] = useState<string>("")
  const [authed, setAuthed] = useState<boolean>(false)
  useEffect(() => {
    const r = getRoleFromToken()
    const a = !!getToken()
    setTimeout(() => { setRole(r); setAuthed(a) }, 0)
  }, [])
  const logout = () => {
    localStorage.removeItem("jwt")
    location.href = "/login"
  }
  return (
    <header className="h-12 border-b flex items-center justify-between px-4">
      <div className="font-semibold">WND-AI</div>
      <div className="flex items-center gap-4">
        <span className="text-sm">Role: {role || "guest"}</span>
        {authed ? <button className="px-3 py-1 border rounded" onClick={logout}>Logout</button> : <a className="underline" href="/login">Login</a>}
      </div>
    </header>
  )
}

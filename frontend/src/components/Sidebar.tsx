'use client'
import { useEffect, useState } from "react"
import { getRoleFromToken } from "../lib/auth"

const items = [
  { href: "/dashboard", label: "Dashboard", roles: ["admin", "supervisor", "agent"] },
  { href: "/calls", label: "Live Calls", roles: ["admin", "supervisor", "agent"] },
  { href: "/campaigns", label: "Campaigns", roles: ["admin", "supervisor"] },
  { href: "/agents", label: "Agents", roles: ["admin", "supervisor"] },
  { href: "/prompts", label: "Prompts", roles: ["admin", "supervisor"] },
  { href: "/history", label: "Call History", roles: ["admin", "supervisor"] },
  { href: "/sms", label: "SMS", roles: ["admin", "supervisor"] },
  { href: "/analytics", label: "Analytics", roles: ["admin", "supervisor"] },
  { href: "/debug", label: "Debug Audio", roles: ["admin", "supervisor"] },
  { href: "/settings", label: "Settings", roles: ["admin", "supervisor", "agent"] }
]

export default function Sidebar() {
  const [role, setRole] = useState<string>("")
  useEffect(() => {
    const r = getRoleFromToken()
    setTimeout(() => setRole(r), 0)
  }, [])
  return (
    <aside className="w-64 border-r h-screen p-4 hidden md:block">
      <h2 className="text-lg font-semibold">Workspace</h2>
      <nav className="mt-4 space-y-2">
        {items.filter(i => i.roles.includes(role)).map(i => (
          <a key={i.href} href={i.href} className="block hover:underline">{i.label}</a>
        ))}
      </nav>
    </aside>
  )
}

'use client'
import "./globals.css"
import { useEffect } from "react"
import { usePathname } from "next/navigation"
import Sidebar from "../components/Sidebar"
 
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  useEffect(() => {
    const isLogin = pathname === "/login"
    const jwt = typeof window !== "undefined" ? localStorage.getItem("jwt") : ""
    const refresh = typeof window !== "undefined" ? localStorage.getItem("refresh") : ""
    if (!isLogin && (!jwt || !refresh) && typeof window !== "undefined") {
      const path = window.location.pathname + window.location.search
      try {
        localStorage.setItem("postLoginRedirect", path)
      } catch {
        void 0
      }
      window.location.href = "/login"
      return
    }

    if (typeof window === "undefined" || isLogin) {
      return
    }

    const timeoutMinutes = Number(process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES || "30")
    const timeoutMs = timeoutMinutes * 60 * 1000

    const touchActivity = () => {
      try {
        localStorage.setItem("lastActivity", String(Date.now()))
        if (localStorage.getItem("sessionExpired") === "1") {
          localStorage.setItem("sessionExpired", "0")
        }
      } catch {
        void 0
      }
    }

    touchActivity()

    const activityEvents: Array<keyof WindowEventMap> = ["click", "keydown", "mousemove", "focus"]
    activityEvents.forEach((evt) => window.addEventListener(evt, touchActivity))
    document.addEventListener("visibilitychange", touchActivity)

    const checkIdle = () => {
      try {
        const raw = localStorage.getItem("lastActivity")
        const expiredFlag = localStorage.getItem("sessionExpired")
        if (expiredFlag === "1") return
        const last = raw ? Number(raw) : 0
        if (!last) return
        const now = Date.now()
        if (now - last > timeoutMs) {
          const lastIso = new Date(last).toISOString()
          const nowIso = new Date(now).toISOString()
          console.info("[session] idle timeout reached", { lastActivity: lastIso, now: nowIso })
          localStorage.setItem("sessionExpired", "1")
          localStorage.removeItem("jwt")
          localStorage.removeItem("refresh")
          const path = window.location.pathname + window.location.search
          localStorage.setItem("postLoginRedirect", path)
          const url = new URL(window.location.href)
          url.pathname = "/login"
          url.searchParams.set("expired", "1")
          url.searchParams.set("next", path)
          window.location.href = url.toString()
        }
      } catch {
        void 0
      }
    }

    const intervalId = window.setInterval(checkIdle, 30000)

    const onStorage = (e: StorageEvent) => {
      try {
        if (e.key === "sessionExpired" && e.newValue === "1") {
          if (window.location.pathname === "/login") return
          const path = window.location.pathname + window.location.search
          localStorage.setItem("postLoginRedirect", path)
          const url = new URL(window.location.href)
          url.pathname = "/login"
          url.searchParams.set("expired", "1")
          url.searchParams.set("next", path)
          window.location.href = url.toString()
        }
        if (e.key === "jwt" && !e.newValue) {
          if (window.location.pathname === "/login") return
          const path = window.location.pathname + window.location.search
          localStorage.setItem("postLoginRedirect", path)
          const url = new URL(window.location.href)
          url.pathname = "/login"
          url.searchParams.set("next", path)
          window.location.href = url.toString()
        }
      } catch {
        void 0
      }
    }

    window.addEventListener("storage", onStorage)

    return () => {
      activityEvents.forEach((evt) => window.removeEventListener(evt, touchActivity))
      document.removeEventListener("visibilitychange", touchActivity)
      window.clearInterval(intervalId)
      window.removeEventListener("storage", onStorage)
    }
  }, [pathname])
  return (
    <html lang="en">
      <head />
      <body className="min-h-screen">
        {pathname !== "/login" ? (
          <div className="flex">
            <Sidebar />
            <main className="flex-1 p-4">{children}</main>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  )
}

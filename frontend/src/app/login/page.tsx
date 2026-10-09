'use client'
import { useEffect, useState } from "react";
import { API_BASE } from "../../lib/api";
import { clearSessionCookie, setSessionCookie, getToken, isTokenExpired } from "../../lib/auth";

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [token, setToken] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [message, setMessage] = useState<string>("")

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

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const url = new URL(window.location.href)
      const expired = url.searchParams.get("expired") === "1"
      const expiredFlag = localStorage.getItem("sessionExpired") === "1"
      localStorage.removeItem("sessionExpired")

      const currentToken = getToken()
      if (currentToken && !isTokenExpired() && !expired && !expiredFlag) {
        window.location.href = redirectTo || "/dashboard"
        return
      }

      if (expired || expiredFlag) {
        clearSessionCookie()
        setMessage("Your session has ended. Please log in again to continue.")
      }
    } catch {
      // ignore
    }
  }, [redirectTo])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json().catch(() => ({}))
      
      if (!res.ok || !data.access_token) {
        setError(data.error || data.message || "Invalid email or password. Please try again.")
        setLoading(false)
        return
      }

      setToken(data.access_token || "")
      localStorage.setItem("jwt", data.access_token || "")
      if (data.refresh_token) localStorage.setItem("refresh", data.refresh_token)
      setSessionCookie()
      try {
        localStorage.removeItem("postLoginRedirect")
      } catch {
        void 0
      }
      const target = redirectTo || "/dashboard"
      window.location.href = target
    } catch (err) {
      setError("Network error. Please check your server connection.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 bg-[url('https://images.unsplash.com/photo-1497294815431-9365093b7331?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <div className="relative z-10 w-full max-w-md p-8 bg-white/95 backdrop-blur shadow-2xl rounded-2xl border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome Back</h1>
          <p className="text-gray-500 mt-2 text-sm">Sign in to your DailMate account</p>
        </div>
        
        {message && (
          <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-700 text-sm rounded">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form className="space-y-6" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input 
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="name@company.com" 
              type="email"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••" 
              type="password" 
              required
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed" 
            type="submit"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Signing in...</span>
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
        
        {token && (
          <div className="mt-6 p-3 bg-gray-100 rounded text-xs break-all text-gray-500 border border-gray-200">
            <span className="font-semibold block mb-1">Debug Token:</span> {token.substring(0, 20)}...
          </div>
        )}
      </div>
    </div>
  )
}

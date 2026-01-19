export function getToken() {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("jwt") || ""
}

export function getRefreshToken() {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("refresh") || ""
}

function b64urlDecode(input: string) {
  let s = input.replace(/-/g, "+").replace(/_/g, "/")
  const pad = s.length % 4
  if (pad) s += "=".repeat(4 - pad)
  try {
    return atob(s)
  } catch {
    return ""
  }
}

export function getRoleFromToken() {
  const t = getToken()
  const parts = t.split(".")
  if (parts.length !== 3) return ""
  const json = b64urlDecode(parts[1])
  try {
    const obj = JSON.parse(json) as { role?: string }
    return obj.role || ""
  } catch {
    return ""
  }
}

export function getTokenExpiryMs() {
  const t = getToken()
  const parts = t.split(".")
  if (parts.length !== 3) return 0
  const json = b64urlDecode(parts[1])
  try {
    const obj = JSON.parse(json) as { exp?: number }
    if (!obj.exp) return 0
    return obj.exp * 1000
  } catch {
    return 0
  }
}

export function isTokenExpired(graceMs = 0) {
  const expMs = getTokenExpiryMs()
  if (!expMs) return false
  return Date.now() + graceMs >= expMs
}

export function setSessionCookie() {
  if (typeof window === "undefined") return
  const base = "session=active; path=/; SameSite=Lax"
  const extra = window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = base + extra
}

export function clearSessionCookie() {
  if (typeof window === "undefined") return
  document.cookie = "session=; Max-Age=0; path=/; SameSite=Lax"
}

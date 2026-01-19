import { getToken, getRefreshToken } from "./auth"

export const API_BASE = "/api"

function resolveUrl(url: string) {
  if (url.startsWith("http://localhost:3000")) return url.replace("http://localhost:3000", API_BASE)
  if (url.startsWith("https://localhost:3000")) return url.replace("https://localhost:3000", API_BASE)
  return url
}

function markSessionExpired(source: string) {
  if (typeof window === "undefined") return
  try {
    const now = new Date().toISOString()
    console.info("[session] expired", { source, at: now })
    localStorage.removeItem("jwt")
    localStorage.removeItem("refresh")
    localStorage.setItem("sessionExpired", "1")
    const path = window.location.pathname + window.location.search
    localStorage.setItem("postLoginRedirect", path)
    const url = new URL(window.location.href)
    url.pathname = "/login"
    url.searchParams.set("expired", "1")
    url.searchParams.set("next", path)
    if (url.toString() !== window.location.href) {
      window.location.href = url.toString()
    }
  } catch {
    return
  }
}

async function refreshAccessToken() {
  const refresh = getRefreshToken()
  if (!refresh) {
    markSessionExpired("no_refresh_token")
    throw new Error("No refresh token")
  }
  const r = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh })
  })
  if (r.status === 401) {
    markSessionExpired("refresh_unauthorized")
    throw new Error("Refresh unauthorized")
  }
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const data = await r.json()
  const access = data.access_token || ""
  if (access) localStorage.setItem("jwt", access)
  const ref = data.refresh_token || ""
  if (ref) localStorage.setItem("refresh", ref)
}

export async function apiGet<T>(url: string): Promise<T> {
  const token = getToken()
  let r = await fetch(resolveUrl(url), { headers: { Authorization: `Bearer ${token}` } })
  if (r.status === 401) {
    try {
      await refreshAccessToken()
      const token2 = getToken()
      r = await fetch(resolveUrl(url), { headers: { Authorization: `Bearer ${token2}` } })
    } catch (err) {
      console.info("[api] get unauthorized, session expired", { url, error: String(err) })
      throw err
    }
  }
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return await r.json()
}

export async function apiDelete<T>(url: string): Promise<T> {
  const token = getToken()
  let r = await fetch(url, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
  if (r.status === 401) {
    try {
      await refreshAccessToken()
      const token2 = getToken()
      r = await fetch(url, { method: "DELETE", headers: { Authorization: `Bearer ${token2}` } })
    } catch (err) {
      console.info("[api] delete unauthorized, session expired", { url, error: String(err) })
      throw err
    }
  }
  if (!r.ok && r.status !== 204) throw new Error(`HTTP ${r.status}`)
  try {
    return await r.json()
  } catch {
    return {} as T
  }
}

export async function apiPostJson<T>(url: string, body: unknown): Promise<T> {
  const token = getToken()
  let r = await fetch(resolveUrl(url), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  })
  if (r.status === 401) {
    try {
      await refreshAccessToken()
      const token2 = getToken()
      r = await fetch(resolveUrl(url), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token2}` },
        body: JSON.stringify(body)
      })
    } catch (err) {
      console.info("[api] post unauthorized, session expired", { url, error: String(err) })
      throw err
    }
  }
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return await r.json()
}

export async function apiPostForm<T>(url: string, form: FormData): Promise<T> {
  const token = getToken()
  let r = await fetch(resolveUrl(url), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form
  })
  if (r.status === 401) {
    try {
      await refreshAccessToken()
      const token2 = getToken()
      r = await fetch(resolveUrl(url), {
        method: "POST",
        headers: { Authorization: `Bearer ${token2}` },
        body: form
      })
    } catch (err) {
      console.info("[api] post-form unauthorized, session expired", { url, error: String(err) })
      throw err
    }
  }
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return await r.json()
}

export async function apiPutJson<T>(url: string, body: unknown): Promise<T> {
  const token = getToken()
  let r = await fetch(resolveUrl(url), {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  })
  if (r.status === 401) {
    try {
      await refreshAccessToken()
      const token2 = getToken()
      r = await fetch(resolveUrl(url), {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token2}` },
        body: JSON.stringify(body)
      })
    } catch (err) {
      console.info("[api] put unauthorized, session expired", { url, error: String(err) })
      throw err
    }
  }
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return await r.json()
}

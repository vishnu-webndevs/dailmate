'use client'
import { useEffect, useMemo, useState } from "react"
import ErrorAlert from "./ErrorAlert"
import { apiGet, apiPostJson, apiDelete } from "../lib/api"

type Row = { name: string; preview: string; createdAt: string; updatedAt: string }

export default function ApiKeyFixedFields() {
  const OPTIONS: Array<{ key: string; label: string; category: string; placeholder: string; doc?: string }> = [
    { key: "OPENAI_API_KEY", label: "OpenAI API Key", category: "LLM", placeholder: "sk-...", doc: "https://platform.openai.com/account/api-keys" },
    { key: "GROQ_API_KEY", label: "Groq API Key", category: "LLM", placeholder: "gsk_...", doc: "https://console.groq.com/keys" },
    { key: "XAI_API_KEY", label: "xAI Grok API Key", category: "LLM", placeholder: "xai-...", doc: "https://x.ai" },
    { key: "ELEVENLABS_API_KEY", label: "ElevenLabs API Key", category: "TTS", placeholder: "elevenlabs_...", doc: "https://elevenlabs.io" },
    { key: "DEEPGRAM_API_KEY", label: "Deepgram API Key", category: "STT", placeholder: "dg_...", doc: "https://console.deepgram.com/signup" },
    { key: "TWILIO_ACCOUNT_SID", label: "Twilio Account SID", category: "Telephony", placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", doc: "https://console.twilio.com" },
    { key: "TWILIO_AUTH_TOKEN", label: "Twilio Auth Token", category: "Telephony", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", doc: "https://console.twilio.com" },
    { key: "TWILIO_FROM", label: "Twilio From Number", category: "Telephony", placeholder: "+15551234567", doc: "https://console.twilio.com" },
    { key: "LIVEKIT_API_KEY", label: "LiveKit API Key", category: "Transport", placeholder: "lk_...", doc: "https://cloud.livekit.io" },
    { key: "LIVEKIT_API_SECRET", label: "LiveKit API Secret", category: "Transport", placeholder: "lk_secret_...", doc: "https://cloud.livekit.io" }
  ]
  const [error, setError] = useState("")
  const [rows, setRows] = useState<Row[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const byName = useMemo(() => {
    const m: Record<string, Row> = {}
    for (const r of rows) m[r.name] = r
    return m
  }, [rows])
  const load = () => {
    apiGet<Row[]>("http://localhost:3000/settings/api-keys").then(setRows).catch((e) => setError(String(e)))
  }
  useEffect(() => { load() }, [])
  const updateValue = (k: string, v: string) => {
    setValues(s => ({ ...s, [k]: v }))
  }
  const save = async (k: string) => {
    const v = values[k] || ""
    if (!v) return
    try {
      await apiPostJson("http://localhost:3000/settings/api-keys", { name: k, value: v })
      updateValue(k, "")
      load()
    } catch (e) {
      setError(String(e))
    }
  }
  const remove = async (k: string) => {
    try {
      await apiDelete(`http://localhost:3000/settings/api-keys/${encodeURIComponent(k)}`)
      updateValue(k, "")
      load()
    } catch (e) {
      setError(String(e))
    }
  }
  const grouped = OPTIONS.reduce((acc, o) => {
    const list = acc.get(o.category) || []
    list.push(o)
    acc.set(o.category, list)
    return acc
  }, new Map<string, Array<{ key: string; label: string; category: string; placeholder: string; doc?: string }>>())
  return (
    <div className="border p-4 rounded">
      <div className="font-semibold mb-2">API Provider Secrets</div>
      <ErrorAlert error={error} />
      {Array.from(grouped.entries()).map(([cat, list]) => (
        <div key={cat} className="mb-4">
          <div className="font-semibold">{cat}</div>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            {list.map(o => {
              const stored = byName[o.key]
              const hint = stored?.preview ? stored.preview : o.placeholder
              return (
                <div key={o.key} className="border p-2 rounded">
                  <div className="text-sm">{o.label}</div>
                  <input className="border p-2 w-full mt-1" value={values[o.key] || ""} onChange={(e) => updateValue(o.key, e.target.value)} placeholder={hint} />
                  <div className="flex gap-2 mt-2">
                    <button className="px-3 py-1 border rounded" onClick={() => save(o.key)}>Save</button>
                    <button className="px-3 py-1 border rounded" onClick={() => remove(o.key)}>Remove</button>
                    {stored && <span className="text-xs text-zinc-600 self-center">Stored</span>}
                    {!stored && <span className="text-xs text-zinc-600 self-center">Not set</span>}
                  </div>
                  {o.doc && <div className="mt-1 text-xs"><a className="underline text-blue-600" href={o.doc} target="_blank" rel="noreferrer">Docs</a></div>}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}


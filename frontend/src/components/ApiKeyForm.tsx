'use client'
import { useState } from "react"
import { apiPostJson } from "../lib/api"
import ErrorAlert from "./ErrorAlert"

export default function ApiKeyForm({ onSaved }: { onSaved: () => void }) {
  const [name, setName] = useState("")
  const [value, setValue] = useState("")
  const [selected, setSelected] = useState<string>("")
  const [error, setError] = useState("")
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
  const grouped = OPTIONS.reduce((acc, o) => {
    const list = acc.get(o.category) || []
    list.push(o)
    acc.set(o.category, list)
    return acc
  }, new Map<string, Array<{ key: string; label: string; category: string; placeholder: string; doc?: string }>>())
  const current = OPTIONS.find(o => o.key === selected)
  const onSelect = (k: string) => {
    setSelected(k)
    const opt = OPTIONS.find(o => o.key === k)
    if (opt) {
      setName(opt.key)
      setValue("")
    }
  }
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiPostJson("/api/settings/api-keys", { name, value })
      setName("")
      setValue("")
      onSaved()
    } catch (e) {
      setError(String(e))
    }
  }
  return (
    <div className="border p-4 rounded">
      <div className="font-semibold mb-2">Add / Update API Key</div>
      <ErrorAlert error={error} />
      <div className="mb-2">
        <label className="block text-sm mb-1">Select secret</label>
        <select className="border p-2 w-full" value={selected} onChange={(e) => onSelect(e.target.value)}>
          <option value="">Custom</option>
          {Array.from(grouped.entries()).map(([cat, list]) => (
            <optgroup key={cat} label={cat}>
              {list.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </optgroup>
          ))}
        </select>
      </div>
      <form className="flex gap-2" onSubmit={submit}>
        <input className="border p-2 flex-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Provider name or env key" />
        <input className="border p-2 flex-1" value={value} onChange={(e) => setValue(e.target.value)} placeholder={current?.placeholder || "Secret value"} />
        <button className="px-3 py-2 border rounded" type="submit">Save</button>
      </form>
      {current?.doc && (
        <div className="mt-2 text-xs text-zinc-600">
          <a className="underline text-blue-600" href={current.doc} target="_blank" rel="noreferrer">{current.label} docs</a>
        </div>
      )}
    </div>
  )
}

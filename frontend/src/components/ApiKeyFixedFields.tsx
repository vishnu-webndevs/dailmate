'use client'
import { useEffect, useMemo, useState } from "react"
import ErrorAlert from "./ErrorAlert"
import { apiGet, apiPostJson, apiDelete } from "../lib/api"

type Row = { name: string; preview: string; createdAt: string; updatedAt: string }

export default function ApiKeyFixedFields({ onUpdate }: { onUpdate?: () => void }) {
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
  const [editing, setEditing] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  
  const byName = useMemo(() => {
    const m: Record<string, Row> = {}
    for (const r of rows) m[r.name] = r
    return m
  }, [rows])

  const load = () => {
    apiGet<Row[]>("/api/settings/api-keys").then(setRows).catch((e) => setError(String(e)))
  }
  
  useEffect(() => { load() }, [])
  
  const updateValue = (k: string, v: string) => {
    setValues(s => ({ ...s, [k]: v }))
  }
  
  const save = async (k: string) => {
    const v = values[k] || ""
    if (!v) return
    try {
      await apiPostJson("/api/settings/api-keys", { name: k, value: v })
      updateValue(k, "")
      setEditing(null)
      load()
      if (onUpdate) onUpdate()
    } catch (e) {
      setError(String(e))
    }
  }
  
  const remove = async (k: string) => {
    if (!confirm("Are you sure you want to remove this key?")) return
    try {
      await apiDelete(`/api/settings/api-keys/${encodeURIComponent(k)}`)
      updateValue(k, "")
      load()
      if (onUpdate) onUpdate()
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
    <div className="space-y-6">
      <ErrorAlert error={error} />
      {Array.from(grouped.entries()).map(([cat, list]) => (
        <div key={cat} className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <span className="font-semibold text-gray-700">{cat}</span>
          </div>
          <div className="divide-y divide-gray-100">
            {list.map(o => {
              const stored = byName[o.key]
              const isEditing = editing === o.key
              
              return (
                <div key={o.key} className="p-4 transition-colors hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${stored ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className="font-medium text-gray-900">{o.label}</span>
                      {o.doc && (
                        <a href={o.doc} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                    <div>
                      {!isEditing && (
                        <button 
                          onClick={() => setEditing(o.key)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {stored ? 'Edit' : 'Configure'}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {isEditing ? (
                    <div className="mt-2 space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Value</label>
                        <input 
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                          value={values[o.key] || ""} 
                          onChange={(e) => updateValue(o.key, e.target.value)} 
                          placeholder={stored?.preview || o.placeholder} 
                          autoFocus
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        {stored && (
                          <button 
                            className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md border border-transparent hover:border-red-200 transition-colors"
                            onClick={() => remove(o.key)}
                          >
                            Remove
                          </button>
                        )}
                        <button 
                          className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-md transition-colors" 
                          onClick={() => setEditing(null)}
                        >
                          Cancel
                        </button>
                        <button 
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md shadow-sm transition-colors" 
                          onClick={() => save(o.key)}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 pl-4">
                      {stored ? (
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">{stored.preview}</span>
                      ) : (
                        <span className="italic text-gray-400">Not configured</span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}



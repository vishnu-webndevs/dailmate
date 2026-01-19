'use client'
import { useEffect, useState } from "react"
import PageHeader from "../../components/PageHeader"
import ErrorAlert from "../../components/ErrorAlert"
import { apiGet, apiPostJson, apiPutJson } from "../../lib/api"

type Agent = { id: number; name: string; description?: string; promptId?: string; twilioFrom?: string; voice?: string; language: "en" | "hi" }
type Prompt = { id: string; name: string; activeVersion: number }
type Voice = { id: string; name: string; category?: string }

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [promptId, setPromptId] = useState<string>("")
  const [twilioFrom, setTwilioFrom] = useState<string>("")
  const [voice, setVoice] = useState<string>("")
  const [language, setLanguage] = useState<"en" | "hi">("en")
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [twilioNumbers, setTwilioNumbers] = useState<Array<{ phoneNumber: string; friendlyName?: string }>>([])
  const [voices, setVoices] = useState<Voice[]>([])
  const [error, setError] = useState("")
  const [editing, setEditing] = useState<Agent | null>(null)
  const [editName, setEditName] = useState<string>("")
  const [editDescription, setEditDescription] = useState<string>("")
  const [editPromptId, setEditPromptId] = useState<string>("")
  const [editTwilioFrom, setEditTwilioFrom] = useState<string>("")
  const [editVoice, setEditVoice] = useState<string>("")
  const [editLanguage, setEditLanguage] = useState<"en" | "hi">("en")
  const [testAgent, setTestAgent] = useState<Agent | null>(null)
  const [testTo, setTestTo] = useState<string>("")
  const [testPromptId, setTestPromptId] = useState<string>("")
  const testNumbers = ["+919672977977", "+919887603015", "+919983409509"]
  const [testResult, setTestResult] = useState<string>("")

  const load = () => {
    apiGet<Agent[]>("/api/agents")
      .then(setAgents)
      .catch((e) => setError(String(e)))
  }
  useEffect(() => {
    load()
    apiGet<Prompt[]>("/api/prompts")
      .then(setPrompts)
      .catch(() => {})
    apiGet<Array<{ phoneNumber: string; friendlyName?: string }>>("/api/twilio/numbers")
      .then((nums) => {
        setTwilioNumbers(nums)
      })
      .catch(() => {})
    apiGet<Voice[]>("/api/tts/voices")
      .then(setVoices)
      .catch(() => {})
  }, [])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiPostJson("/api/agents", { name, description, promptId, twilioFrom, voice, language })
      setName("")
      setDescription("")
      setPromptId("")
      setTwilioFrom("")
      setVoice("")
      setLanguage("en")
      load()
    } catch (e) {
      setError(String(e))
    }
  }

  const openEdit = (a: Agent) => {
    setEditing(a)
    setEditName(a.name || "")
    setEditDescription(a.description || "")
    setEditPromptId(a.promptId || "")
    setEditTwilioFrom(a.twilioFrom || "")
    setEditVoice(a.voice || "")
    setEditLanguage(a.language || "en")
  }
  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    try {
      await apiPutJson(`/api/agents/${editing.id}`, {
        name: editName,
        description: editDescription,
        promptId: editPromptId,
        twilioFrom: editTwilioFrom,
        voice: editVoice,
        language: editLanguage
      })
      setEditing(null)
      load()
    } catch (err) {
      setError(String(err))
    }
  }
  const openTest = (a: Agent) => {
    setTestAgent(a)
    setTestTo(testNumbers[0])
    setTestPromptId("")
    setTestResult("")
  }
  const runTest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testAgent) return
    try {
      const body: Record<string, unknown> = { to: testTo, agent_id: testAgent.id }
      if (testPromptId) body["prompt_id"] = testPromptId
      const res = await apiPostJson<{ queued: boolean; sid?: string }>("/api/twilio/outbound", body)
      setTestResult(res.queued ? `Queued SID: ${res.sid || ""}` : "Failed to queue")
    } catch (err) {
      setTestResult(String(err))
    }
  }

  return (
    <main>
      <PageHeader title="Agents" />
      <ErrorAlert error={error} />
      <form className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2" onSubmit={create}>
        <input className="border p-2" value={name} onChange={e => setName(e.target.value)} placeholder="Name" />
        <input className="border p-2" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" />
        <div>
          <select className="border p-2 w-full" value={promptId} onChange={e => setPromptId(e.target.value)}>
            <option value="">Select Prompt</option>
            {prompts.map(p => <option key={p.id} value={p.id}>{p.name} (v{p.activeVersion})</option>)}
          </select>
        </div>
        <div>
          <select className="border p-2 w-full" value={language} onChange={e => setLanguage(e.target.value as "en" | "hi")}>
            <option value="en">Language: English</option>
            <option value="hi">Language: Hindi</option>
          </select>
        </div>
        {twilioNumbers.length > 0 ? (
          <select className="border p-2" value={twilioFrom} onChange={e => setTwilioFrom(e.target.value)}>
            <option value="">Select Twilio Number</option>
            {twilioNumbers.map(n => <option key={n.phoneNumber} value={n.phoneNumber}>{n.friendlyName ? `${n.friendlyName} ` : ""}{n.phoneNumber}</option>)}
          </select>
        ) : (
          <input className="border p-2" value={twilioFrom} onChange={e => setTwilioFrom(e.target.value)} placeholder="Twilio From (+15551234567)" />
        )}
        {voices.length > 0 ? (
          <select className="border p-2" value={voice} onChange={e => setVoice(e.target.value)}>
            <option value="">Select Voice</option>
            {voices.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        ) : (
          <input className="border p-2" value={voice} onChange={e => setVoice(e.target.value)} placeholder="Voice (e.g., elevenlabs voice id/name)" />
        )}
        <button className="px-4 py-2 border rounded" type="submit">Create</button>
      </form>
      <div className="mt-4">
        <table className="w-full border">
          <thead>
            <tr>
              <th className="text-left p-2 border-b">ID</th>
              <th className="text-left p-2 border-b">Name</th>
              <th className="text-left p-2 border-b">Description</th>
              <th className="text-left p-2 border-b">Prompt</th>
              <th className="text-left p-2 border-b">Twilio From</th>
              <th className="text-left p-2 border-b">Voice</th>
              <th className="text-left p-2 border-b">Language</th>
              <th className="text-left p-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {agents.map(a => (
              <tr key={a.id} className="border-b">
                <td className="p-2">{a.id}</td>
                <td className="p-2">{a.name}</td>
                <td className="p-2">{a.description || ""}</td>
                <td className="p-2">{a.promptId || ""}</td>
                <td className="p-2">{a.twilioFrom || ""}</td>
                <td className="p-2">{a.voice || ""}</td>
                <td className="p-2">{a.language === "hi" ? "Hindi" : "English"}</td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <button className="px-3 py-1 border rounded" onClick={() => openEdit(a)}>Edit</button>
                    <button className="px-3 py-1 border rounded" onClick={() => openTest(a)}>Test Call</button>
                  </div>
                </td>
              </tr>
            ))}
            {agents.length === 0 && (
              <tr><td className="p-2 text-zinc-500">No data</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded p-4 w-full max-w-lg">
            <div className="font-semibold mb-2">Edit Agent #{editing.id}</div>
            <form className="grid grid-cols-1 gap-2" onSubmit={saveEdit}>
              <input className="border p-2" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Name" />
              <input className="border p-2" value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="Description" />
              <select className="border p-2" value={editPromptId} onChange={e => setEditPromptId(e.target.value)}>
                <option value="">Select Prompt</option>
                {prompts.map(p => <option key={p.id} value={p.id}>{p.name} (v{p.activeVersion})</option>)}
              </select>
              <select className="border p-2" value={editLanguage} onChange={e => setEditLanguage(e.target.value as "en" | "hi")}>
                <option value="en">Language: English</option>
                <option value="hi">Language: Hindi</option>
              </select>
              {twilioNumbers.length > 0 ? (
                <select className="border p-2" value={editTwilioFrom} onChange={e => setEditTwilioFrom(e.target.value)}>
                  <option value="">Select Twilio Number</option>
                  {twilioNumbers.map(n => <option key={n.phoneNumber} value={n.phoneNumber}>{n.friendlyName ? `${n.friendlyName} ` : ""}{n.phoneNumber}</option>)}
                </select>
              ) : (
                <input className="border p-2" value={editTwilioFrom} onChange={e => setEditTwilioFrom(e.target.value)} placeholder="Twilio From (+15551234567)" />
              )}
              <input className="border p-2" value={editVoice} onChange={e => setEditVoice(e.target.value)} placeholder="Voice (e.g., elevenlabs voice id/name)" />
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" className="px-3 py-2 border rounded" onClick={() => setEditing(null)}>Cancel</button>
                <button type="submit" className="px-3 py-2 border rounded">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {testAgent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded p-4 w-full max-w-lg">
            <div className="font-semibold mb-2">Test Outbound — Agent #{testAgent.id}</div>
            <form className="grid grid-cols-1 gap-2" onSubmit={runTest}>
              <select className="border p-2" value={testTo} onChange={e => setTestTo(e.target.value)}>
                {testNumbers.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <select className="border p-2" value={testPromptId} onChange={e => setTestPromptId(e.target.value)}>
                <option value="">Use agent&apos;s prompt</option>
                {prompts.map(p => <option key={p.id} value={p.id}>{p.name} (v{p.activeVersion})</option>)}
              </select>
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" className="px-3 py-2 border rounded" onClick={() => setTestAgent(null)}>Close</button>
                <button type="submit" className="px-3 py-2 border rounded">Start Call</button>
              </div>
            </form>
            {testResult && <div className="mt-2 text-sm">{testResult}</div>}
          </div>
        </div>
      )}
    </main>
  )
}

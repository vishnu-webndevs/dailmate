'use client'
import { useEffect, useState } from "react"
import PageHeader from "../../components/PageHeader"
import ErrorAlert from "../../components/ErrorAlert"
import { apiGet, apiPostJson, apiPutJson, apiDelete } from "../../lib/api"

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
  const [isCreating, setIsCreating] = useState(false)
  const [isManualNumber, setIsManualNumber] = useState(false)

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
      setIsCreating(false)
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
    setIsManualNumber(false)
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

  const deleteAgent = async (a: Agent) => {
    if (!confirm(`Are you sure you want to delete agent "${a.name}"?`)) return
    try {
      await apiDelete(`/api/agents/${a.id}`)
      load()
    } catch (err) {
      setError(String(err))
    }
  }

  return (
      <div className="space-y-6">
        <PageHeader title="Agents Management" />
        <ErrorAlert error={error} />
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {!isCreating ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Agents</h2>
                <p className="text-sm text-gray-500 mt-1">Manage your AI voice agents</p>
              </div>
              <button 
                onClick={() => setIsCreating(true)}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                Create New Agent
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Create New Agent</h2>
                <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" onSubmit={create}>
                <input className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" value={name} onChange={e => setName(e.target.value)} placeholder="Agent Name" />
                <input className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (Optional)" />
                
                <select className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white" value={promptId} onChange={e => setPromptId(e.target.value)}>
                  <option value="">Select Prompt Template</option>
                  {prompts.map(p => <option key={p.id} value={p.id}>{p.name} (v{p.activeVersion})</option>)}
                </select>
                
                <select className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white" value={language} onChange={e => setLanguage(e.target.value as "en" | "hi")}>
                  <option value="en">Language: English</option>
                  <option value="hi">Language: Hindi</option>
                </select>
                
                {twilioNumbers.length > 0 ? (
                  <select className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white" value={twilioFrom} onChange={e => setTwilioFrom(e.target.value)}>
                    <option value="">Select Twilio Number</option>
                    {twilioNumbers.map(n => <option key={n.phoneNumber} value={n.phoneNumber}>{n.friendlyName ? `${n.friendlyName} ` : ""}{n.phoneNumber}</option>)}
                  </select>
                ) : (
                  <input className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" value={twilioFrom} onChange={e => setTwilioFrom(e.target.value)} placeholder="Twilio From (+15551234567)" />
                )}
                
                {voices.length > 0 ? (
                  <select className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white" value={voice} onChange={e => setVoice(e.target.value)}>
                    <option value="">Select Voice ID</option>
                    {voices.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                ) : (
                  <input className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" value={voice} onChange={e => setVoice(e.target.value)} placeholder="Voice (e.g., elevenlabs voice id/name)" />
                )}
                
                <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                  <button 
                    type="button" 
                    onClick={() => setIsCreating(false)} 
                    className="w-full sm:w-auto px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition-all transform hover:scale-[1.02]" 
                    type="submit"
                  >
                    Create Agent
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-medium tracking-wider">Name</th>
                  <th className="px-6 py-3 font-medium tracking-wider">Description</th>
                  <th className="px-6 py-3 font-medium tracking-wider">Config</th>
                  <th className="px-6 py-3 font-medium tracking-wider">Language</th>
                  <th className="px-6 py-3 font-medium tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map(a => (
                  <tr key={a.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{a.name}</td>
                    <td className="px-6 py-4">{a.description || "-"}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs">
                         <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded w-fit">Prompt: {a.promptId || "Default"}</span>
                         <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded w-fit">Voice: {a.voice?.substring(0,8) || "Default"}...</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${a.language === 'hi' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>
                        {a.language === "hi" ? "Hindi" : "English"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-900 font-medium text-sm" onClick={() => openEdit(a)}>Edit</button>
                        <span className="text-gray-300">|</span>
                        <button className="text-green-600 hover:text-green-900 font-medium text-sm" onClick={() => openTest(a)}>Test</button>
                        <span className="text-gray-300">|</span>
                        <button className="text-red-600 hover:text-red-900 font-medium text-sm" onClick={() => deleteAgent(a)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {agents.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No agents found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {editing && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Edit Agent</h3>
              </div>
              <div className="p-6">
                <form className="space-y-4" onSubmit={saveEdit}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" value={editName} onChange={e => setEditName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" value={editDescription} onChange={e => setEditDescription(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
                    <select className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={editPromptId} onChange={e => setEditPromptId(e.target.value)}>
                      <option value="">Select Prompt</option>
                      {prompts.map(p => <option key={p.id} value={p.id}>{p.name} (v{p.activeVersion})</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                      <select className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={editLanguage} onChange={e => setEditLanguage(e.target.value as "en" | "hi")}>
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Voice</label>
                      <input className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" value={editVoice} onChange={e => setEditVoice(e.target.value)} />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-6">
                    <button type="button" className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors" onClick={() => setEditing(null)}>Cancel</button>
                    <button type="submit" className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">Save Changes</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {testAgent && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
                <h3 className="text-lg font-semibold text-gray-900">Test Call - {testAgent.name}</h3>
              </div>
              <div className="p-6">
                <form className="space-y-4" onSubmit={runTest}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Test Number</label>
                    {!isManualNumber ? (
                      <select 
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                        value={testTo} 
                        onChange={e => {
                          if (e.target.value === 'manual') {
                            setIsManualNumber(true)
                            setTestTo('')
                          } else {
                            setTestTo(e.target.value)
                          }
                        }}
                      >
                        {testNumbers.map(n => <option key={n} value={n}>{n}</option>)}
                        <option value="manual">+ Enter new number...</option>
                      </select>
                    ) : (
                      <div className="flex gap-2">
                        <input 
                          type="tel"
                          autoFocus
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                          value={testTo} 
                          onChange={e => setTestTo(e.target.value)}
                          placeholder="Enter number (e.g., +91...)"
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            setIsManualNumber(false)
                            setTestTo(testNumbers[0] || "")
                          }}
                          className="px-3 py-2 text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200"
                          title="Select from list"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Override Prompt (Optional)</label>
                    <select className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={testPromptId} onChange={e => setTestPromptId(e.target.value)}>
                      <option value="">Use agent&apos;s default prompt</option>
                      {prompts.map(p => <option key={p.id} value={p.id}>{p.name} (v{p.activeVersion})</option>)}
                    </select>
                  </div>
                  
                  {testResult && (
                    <div className={`p-3 rounded-lg text-sm ${testResult.includes('Queued') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {testResult}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 mt-6">
                    <button type="button" className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors" onClick={() => setTestAgent(null)}>Close</button>
                    <button type="submit" className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                      Start Call
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
  )
}

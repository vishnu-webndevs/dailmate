'use client'
import { useEffect, useState } from "react"
import PageHeader from "../../components/PageHeader"
import ErrorAlert from "../../components/ErrorAlert"
import { apiGet, apiPostJson } from "../../lib/api"

type Prompt = { id: string; name: string; activeVersion: number }
type PromptVersion = { id: string; promptId: string; version: number; content: string; createdAt: string }

export default function Prompts() {
  const [list, setList] = useState<Prompt[]>([])
  const [selected, setSelected] = useState<Prompt | null>(null)
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [name, setName] = useState("")
  const [content, setContent] = useState("")
  const [newVersion, setNewVersion] = useState("")
  const [error, setError] = useState("")
  const load = () => {
    apiGet<Prompt[]>("/api/prompts")
      .then(setList)
      .catch((e) => setError(String(e)))
  }
  useEffect(() => { load() }, [])
  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiPostJson("/api/prompts", { name, content })
      setName("")
      setContent("")
      load()
    } catch (e) {
      setError(String(e))
    }
  }
  const loadVersions = async (p: Prompt) => {
    setSelected(p)
    try {
      const v = await apiGet<PromptVersion[]>(`/api/prompts/${p.id}/versions`)
      setVersions(v)
    } catch (e) {
      setError(String(e))
    }
  }
  const addVersion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    try {
      await apiPostJson(`/api/prompts/${selected.id}/versions`, { content: newVersion })
      setNewVersion("")
      loadVersions(selected)
      load()
    } catch (e) {
      setError(String(e))
    }
  }
  return (
    <div className="space-y-6">
      <PageHeader title="Prompts Library" />
      <ErrorAlert error={error} />
      
      {/* Create Prompt Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Prompt</h2>
        <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={create}>
          <input 
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Prompt Name" 
          />
          <input 
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
            value={content} 
            onChange={e => setContent(e.target.value)} 
            placeholder="Initial Content" 
          />
          <div className="flex justify-end md:justify-start">
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition-all transform hover:scale-[1.02] w-full md:w-auto" 
              type="submit"
            >
              Create Prompt
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prompts List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-900">Available Prompts</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {list.map(p => (
              <li key={p.id} className={`p-4 hover:bg-gray-50 transition-colors flex items-center justify-between cursor-pointer ${selected?.id === p.id ? 'bg-blue-50' : ''}`} onClick={() => loadVersions(p)}>
                <div>
                  <h3 className="font-medium text-gray-900">{p.name}</h3>
                  <span className="text-xs text-gray-500">Current Version: v{p.activeVersion}</span>
                </div>
                <button 
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${selected?.id === p.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'}`}
                  onClick={(e) => { e.stopPropagation(); loadVersions(p); }}
                >
                  View Versions
                </button>
              </li>
            ))}
            {list.length === 0 && (
              <li className="p-8 text-center text-gray-500">No prompts found. Create one above.</li>
            )}
          </ul>
        </div>

        {/* Versions List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-900">
              {selected ? `Versions for "${selected.name}"` : 'Select a prompt to view versions'}
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[600px]">
            {selected ? (
              <>
                {versions.length > 0 ? (
                  <ul className="space-y-3">
                    {versions.map(v => (
                      <li key={v.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Version {v.version}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(v.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{v.content}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center text-gray-500 py-8">No versions found for this prompt.</div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>Select a prompt from the list to manage versions</p>
              </div>
            )}
          </div>

          {selected && (
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <form className="flex gap-2" onSubmit={addVersion}>
                <input 
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                  value={newVersion} 
                  onChange={e => setNewVersion(e.target.value)} 
                  placeholder="New version content" 
                />
                <button 
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition-all" 
                  type="submit"
                >
                  Add
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

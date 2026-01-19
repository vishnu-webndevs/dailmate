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
    <main>
      <PageHeader title="Prompts" />
      <ErrorAlert error={error} />
      <form className="mt-4 flex gap-2" onSubmit={create}>
        <input className="border p-2" value={name} onChange={e => setName(e.target.value)} placeholder="Name" />
        <input className="border p-2" value={content} onChange={e => setContent(e.target.value)} placeholder="Initial content" />
        <button className="px-4 py-2 border rounded" type="submit">Create</button>
      </form>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <ul className="space-y-2">
          {list.map(p => (
            <li key={p.id} className="border p-2 flex justify-between">
              <span>{p.name}</span>
              <button className="px-3 py-1 border rounded" onClick={() => loadVersions(p)}>View Versions</button>
            </li>
          ))}
          {list.length === 0 && <li>No prompts</li>}
        </ul>
        <div>
          <h2 className="text-lg font-semibold">Versions</h2>
          <ul className="space-y-2 mt-2">
            {versions.map(v => <li key={v.id} className="border p-2"><div>v{v.version}</div><div className="text-sm">{v.content}</div></li>)}
            {versions.length === 0 && <li>No versions</li>}
          </ul>
          {selected && (
            <form className="mt-4 flex gap-2" onSubmit={addVersion}>
              <input className="border p-2" value={newVersion} onChange={e => setNewVersion(e.target.value)} placeholder="New version content" />
              <button className="px-4 py-2 border rounded" type="submit">Add Version</button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}

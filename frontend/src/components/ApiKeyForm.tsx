'use client'
import { useState } from "react"
import { apiPostJson } from "../lib/api"
import ErrorAlert from "./ErrorAlert"

export default function ApiKeyForm({ onSaved }: { onSaved: () => void }) {
  const [name, setName] = useState("")
  const [value, setValue] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const [error, setError] = useState("")
  
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiPostJson("/api/settings/api-keys", { name, value })
      setName("")
      setValue("")
      setIsExpanded(false)
      onSaved()
    } catch (e) {
      setError(String(e))
    }
  }

  if (!isExpanded) {
    return (
      <button 
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Custom Environment Variable
      </button>
    )
  }

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900">Add Custom Variable</h3>
        <button 
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <ErrorAlert error={error} />
      
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
          <input 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase" 
            value={name} 
            onChange={(e) => setName(e.target.value.toUpperCase())} 
            placeholder="MY_CUSTOM_KEY" 
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
          <input 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
            value={value} 
            onChange={(e) => setValue(e.target.value)} 
            placeholder="Secret value..." 
            required
          />
        </div>
        
        <div className="flex justify-end gap-3">
          <button 
            type="button"
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-colors" 
            onClick={() => setIsExpanded(false)}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow transition-colors" 
            type="submit"
          >
            Save Variable
          </button>
        </div>
      </form>
    </div>
  )
}


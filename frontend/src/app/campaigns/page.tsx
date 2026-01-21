'use client'
import { useState } from "react";
import PageHeader from "../../components/PageHeader"
import ErrorAlert from "../../components/ErrorAlert"
import { apiPostForm } from "../../lib/api"

export default function Campaigns() {
  const [status, setStatus] = useState<string>("")
  const [error, setError] = useState<string>("")
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    try {
      const data = await apiPostForm<{ total: number; queued: number }>("/api/campaigns/batch-call", fd)
      setStatus(`Successfully queued ${data.queued} calls out of ${data.total} records.`)
    } catch (e) {
      setError(String(e))
    }
  }
  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Batch Call Campaign" />
      <ErrorAlert error={error} />
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload CSV File</h3>
        <p className="text-sm text-gray-500 mb-6">
          Upload a CSV file containing phone numbers to start a batch calling campaign. 
          The CSV should have headers: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">phone</code>, <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">name</code>.
        </p>
        
        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
            <input 
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                cursor-pointer" 
              name="file" 
              type="file" 
              accept=".csv" 
            />
          </div>
          
          <div className="flex justify-end">
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition-all transform hover:scale-[1.02]" 
              type="submit"
            >
              Start Campaign
            </button>
          </div>
        </form>
      </div>

      {status && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-green-800">{status}</p>
          </div>
        </div>
      )}
    </div>
  )
}

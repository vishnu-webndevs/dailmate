'use client'
import { useState } from "react";

import PageHeader from "../../components/PageHeader";

export default function SMS() {
  const [to, setTo] = useState("")
  const [text, setText] = useState("")
  const [status, setStatus] = useState<string>("")
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem("jwt") || ""
    const res = await fetch("/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ to, text })
    })
    const data = await res.json()
    setStatus(JSON.stringify(data, null, 2))
  }
  return (
    <div className="space-y-6">
      <PageHeader title="SMS Messaging" />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Send New Message</h2>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Number</label>
              <input 
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                value={to} 
                onChange={e => setTo(e.target.value)} 
                placeholder="+15551234567" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message Content</label>
              <textarea 
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-h-[120px]" 
                value={text} 
                onChange={e => setText(e.target.value)} 
                placeholder="Type your message here..."
              ></textarea>
            </div>
            
            <button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow transition-all transform hover:scale-[1.01] flex justify-center items-center gap-2" 
              type="submit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send Message
            </button>
          </form>
        </div>

        {status && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Status</h2>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm text-gray-800 overflow-x-auto border border-gray-200">
              <pre>{status}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

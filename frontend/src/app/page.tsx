'use client'
import { useEffect, useState } from "react";

export default function Home() {
  const [health, setHealth] = useState<string>("")
  useEffect(() => {
    fetch("/api/health")
      .then(r => r.json())
      .then(d => setHealth(JSON.stringify(d)))
      .catch(() => setHealth("unavailable"))
  }, [])
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          DailMate
        </div>
        <a href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">Sign In</a>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
          System Operational
        </div>
        
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
          AI-Powered <span className="text-blue-600">Voice Agents</span> <br/> for Your Business
        </h1>
        
        <p className="text-xl text-gray-500 mb-10 max-w-2xl">
          Automate your calls, manage campaigns, and analyze conversations with our advanced voice AI platform.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <a href="/login" className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            Launch Console
          </a>
          <a href="/calls" className="px-8 py-4 bg-white text-gray-700 font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            View Live Demo
          </a>
        </div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-left">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">99%</div>
            <div className="text-sm text-gray-500">Uptime</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">24/7</div>
            <div className="text-sm text-gray-500">Availability</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">Real-time</div>
            <div className="text-sm text-gray-500">Analytics</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
             <div className="text-sm text-gray-500">Backend Status</div>
             <div className="font-medium text-gray-900 truncate">{health === 'unavailable' ? 'Offline' : 'Online'}</div>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-gray-400 border-t border-gray-100">
        © 2024 DailMate. All rights reserved.
      </footer>
    </div>
  );
}

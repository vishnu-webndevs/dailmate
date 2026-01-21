'use client'
import PageHeader from "../../components/PageHeader"
import { getRoleFromToken } from "../../lib/auth"
import { useEffect, useState } from "react"
import ErrorAlert from "../../components/ErrorAlert"
import ApiKeyForm from "../../components/ApiKeyForm"
import ApiKeyList from "../../components/ApiKeyList"
import ApiKeyFixedFields from "../../components/ApiKeyFixedFields"
import { API_BASE } from "../../lib/api"

export default function Settings() {
  const [role, setRole] = useState<string>("")
  const [health, setHealth] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [refreshCount, setRefreshCount] = useState<number>(0)
  useEffect(() => {
    const r = getRoleFromToken()
    setTimeout(() => setRole(r), 0)
    fetch(`${API_BASE}/health`).then(r => r.json()).then(d => setHealth(JSON.stringify(d))).catch((e) => setError(String(e)))
  }, [])
  const logoutAll = () => {
    alert("This would invalidate all sessions (UI only).")
  }
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />
      <ErrorAlert error={error} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-gray-500">Role</span>
              <span className="font-medium px-2.5 py-0.5 rounded-full text-sm bg-gray-100 text-gray-800 capitalize">
                {role || "guest"}
              </span>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Security</h2>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-4">Manage your active sessions and security preferences.</p>
            <button 
              className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-4 rounded-lg shadow-sm transition-colors flex justify-center items-center gap-2"
              onClick={logoutAll}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout all sessions
            </button>
          </div>
        </div>

        {/* API Status Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
          </div>
          
          {health ? (
            (() => {
              const data = JSON.parse(health)
              const isHealthy = data.ok && data.db
              return (
                <div className="space-y-4">
                  <div className={`flex items-center p-4 rounded-lg ${isHealthy ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                    <div className={`p-2 rounded-full mr-4 ${isHealthy ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                       {isHealthy ? (
                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                       ) : (
                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                       )}
                    </div>
                    <div>
                      <h3 className={`text-lg font-medium ${isHealthy ? 'text-green-900' : 'text-red-900'}`}>
                        {isHealthy ? "All Systems Operational" : "System Issues Detected"}
                      </h3>
                      <p className={`text-sm ${isHealthy ? 'text-green-700' : 'text-red-700'}`}>
                        {isHealthy ? "All services are running smoothly." : "Attention needed for some services."}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-gray-600 font-medium">API Server</span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${data.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {data.ok ? "ONLINE" : "OFFLINE"}
                        </span>
                     </div>
                     <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-gray-600 font-medium">Database</span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${data.db ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {data.db ? "CONNECTED" : "DISCONNECTED"}
                        </span>
                     </div>
                  </div>
                  
                  {!isHealthy && (
                     <div className="p-4 bg-red-50 rounded-lg border border-red-100 mt-4">
                        <h4 className="text-sm font-semibold text-red-900 mb-2">Issues:</h4>
                        <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                          {!data.ok && <li>API Server is reporting errors.</li>}
                          {!data.db && <li>Database connection failed. Please check your configuration.</li>}
                        </ul>
                     </div>
                  )}
                </div>
              )
            })()
          ) : (
            <div className="animate-pulse space-y-4">
               <div className="h-16 bg-gray-100 rounded-lg w-full"></div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="h-12 bg-gray-100 rounded-lg"></div>
                 <div className="h-12 bg-gray-100 rounded-lg"></div>
               </div>
            </div>
          )}
        </div>

        {/* API Keys Management (Admin Only) */}
        {role === "admin" && (
          <div className="md:col-span-2 space-y-6">
            <div className="border-t border-gray-200 my-8"></div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Integrations & API Keys</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Standard Integrations */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    Standard Integrations
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Configure your AI providers, telephony services, and other core integrations here.
                  </p>
                  <ApiKeyFixedFields onUpdate={() => setRefreshCount(c => c + 1)} />
                </div>
              </div>

              {/* Stored API Keys Section */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
                  <h3 className="font-semibold text-gray-900 mb-4">Stored API Keys</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    View all stored keys and add custom variables.
                  </p>
                  
                  <div className="space-y-4">
                    <ApiKeyList refresh={refreshCount} />
                    <div className="pt-4 border-t border-gray-100">
                      <ApiKeyForm onSaved={() => setRefreshCount((c) => c + 1)} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

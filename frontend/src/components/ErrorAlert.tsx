'use client'
export default function ErrorAlert({ error }: { error?: string }) {
  if (!error) return null
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-md">
      <div className="flex">
        <div className="flex-shrink-0">
          <span className="text-red-500 font-bold">!</span>
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    </div>
  )
}

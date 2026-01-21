'use client'
export default function MetricCard({ title, value }: { title: string; value: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</div>
      <div className="mt-2 text-3xl font-bold text-gray-900">{value}</div>
    </div>
  )
}

'use client'
export default function MetricCard({ title, value }: { title: string; value: React.ReactNode }) {
  return (
    <div className="border p-4 rounded">
      <div className="text-sm text-zinc-600">{title}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  )
}

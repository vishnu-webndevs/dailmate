'use client'
export default function DataTable<T extends Record<string, unknown>>({ rows, columns, keyField }: { rows: T[]; columns: Array<{ key: keyof T; label: string }>; keyField: keyof T }) {
  return (
    <table className="w-full border">
      <thead>
        <tr>
          {columns.map(c => <th key={String(c.key)} className="text-left p-2 border-b">{c.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={String(r[keyField])} className="border-b">
            {columns.map(c => <td key={String(c.key)} className="p-2">{String(r[c.key] ?? "")}</td>)}
          </tr>
        ))}
        {rows.length === 0 && (
          <tr><td className="p-2 text-zinc-500">No data</td></tr>
        )}
      </tbody>
    </table>
  )
}

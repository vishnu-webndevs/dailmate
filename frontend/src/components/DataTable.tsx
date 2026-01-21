'use client'
export default function DataTable<T extends Record<string, unknown>>({ rows, columns, keyField }: { rows: T[]; columns: Array<{ key: keyof T; label: string }>; keyField: keyof T }) {
  return (
    <div className="relative overflow-x-auto shadow-sm sm:rounded-lg border border-gray-200">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            {columns.map(c => (
              <th key={String(c.key)} className="px-6 py-3 font-medium tracking-wider">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={String(r[keyField])} className="bg-white border-b hover:bg-gray-50 transition-colors">
              {columns.map(c => (
                <td key={String(c.key)} className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                  {String(r[c.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-400">
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

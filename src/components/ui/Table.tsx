import type { ReactNode } from 'react'

// Pass one header per column (use '' for an unlabelled column) and the <tr> rows as children
export default function Table({ columns, children }: { columns: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500 uppercase">
          <tr>
            {columns.map((column, i) => (
              <th key={i} className="px-5 py-3">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">{children}</tbody>
      </table>
    </div>
  )
}

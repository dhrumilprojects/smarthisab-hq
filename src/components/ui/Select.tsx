import type { SelectHTMLAttributes } from 'react'

// Pass the <option>s as children
export default function Select(props: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'>) {
  return (
    <select
      {...props}
      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-brand-600 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
    />
  )
}

import type { InputHTMLAttributes } from 'react'

const fieldClass =
  'rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-brand-600 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500'

export default function Input(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'className'>) {
  return <input {...props} className={fieldClass} />
}

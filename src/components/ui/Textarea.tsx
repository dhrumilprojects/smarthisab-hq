import type { TextareaHTMLAttributes } from 'react'

export default function Textarea(props: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>) {
  return (
    <textarea
      rows={3}
      {...props}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-600 focus:outline-none"
    />
  )
}

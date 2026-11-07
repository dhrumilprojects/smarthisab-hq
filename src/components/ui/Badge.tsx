import type { ReactNode } from 'react'

const tones = {
  neutral: 'bg-gray-100 text-gray-600',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
}

// Small pill for statuses like "12 days left" or "Expired"
export default function Badge({ tone = 'neutral', children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${tones[tone]}`}>
      {children}
    </span>
  )
}

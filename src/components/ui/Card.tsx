import type { ReactNode } from 'react'

// White panel that every dashboard widget and list sits in
export default function Card({ padded = false, children }: { padded?: boolean; children: ReactNode }) {
  return (
    <div className={`flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs ${padded ? 'p-5' : ''}`}>
      {children}
    </div>
  )
}

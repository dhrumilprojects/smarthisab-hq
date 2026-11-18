import type { ReactNode } from 'react'

type Props = {
  selected: boolean
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}

// Pill button for filters and toggles
export default function Chip({ selected, onClick, disabled, children }: Props) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border px-3 py-1 text-sm font-medium disabled:cursor-default ${
        selected ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-gray-300 text-gray-600 enabled:hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  )
}

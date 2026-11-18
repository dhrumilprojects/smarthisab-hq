import { useEffect, useRef, useState, type ReactNode } from 'react'

type Props = {
  // What the pill shows
  trigger: ReactNode
  // Names the popover for screen readers
  label: string
  // Shows the pill as plain text, with nothing to open
  disabled?: boolean
  // Gets a function that closes the popover, for after a choice is made
  children: (close: () => void) => ReactNode
}

const pill = 'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap'

// Small pill that opens a popover under it. Closes on Esc or a click outside.
export default function Popover({ trigger, label, disabled, children }: Props) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  if (disabled) return <span className={`${pill} border-gray-200 text-gray-700`}>{trigger}</span>

  return (
    <span
      ref={root}
      className="relative inline-block"
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || !open) return
        // Keep the Esc from also closing a side panel this sits in
        event.stopPropagation()
        setOpen(false)
      }}
    >
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={`${pill} text-gray-700 hover:bg-gray-50 ${open ? 'border-brand-600' : 'border-gray-300'}`}
      >
        {trigger}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3 text-gray-400">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={label}
          className="absolute top-full left-0 z-20 mt-1 min-w-52 rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg"
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </span>
  )
}

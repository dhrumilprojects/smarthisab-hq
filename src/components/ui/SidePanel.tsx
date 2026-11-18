import { useEffect, useRef, type ReactNode } from 'react'

type Props = {
  label: string
  onClose: () => void
  children: ReactNode
}

// Panel that slides over the right half of the screen. The page behind it stays usable.
// Closes on Esc or a click outside, except on elements marked `data-panel-trigger`
// (like the rows that open it), so clicking another row swaps the panel instead.
export default function SidePanel({ label, onClose, children }: Props) {
  const panel = useRef<HTMLElement>(null)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Element
      if (!panel.current?.contains(target) && !target.closest('[data-panel-trigger]')) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [onClose])

  return (
    <aside
      ref={panel}
      role="dialog"
      aria-label={label}
      className="fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l border-gray-200 bg-white shadow-2xl md:w-1/2"
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 z-10 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </aside>
  )
}

type Props<T extends string> = {
  tabs: { id: T; label: string }[]
  active: T
  onChange: (id: T) => void
}

// Row of tab buttons. The parent renders the active tab's content below it.
export default function Tabs<T extends string>({ tabs, active, onChange }: Props<T>) {
  return (
    <div role="tablist" className="flex gap-6 border-b border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={tab.id === active}
          onClick={() => onChange(tab.id)}
          className={`-mb-px border-b-2 py-3 text-sm font-medium ${
            tab.id === active
              ? 'border-brand-600 text-brand-800'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

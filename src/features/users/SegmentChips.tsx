import type { UserSegment, UserSegments } from '../../data/types'
import { SEGMENTS } from './segments'

type Props = {
  // null shows all users
  active: UserSegment | null
  // undefined while loading or when it failed. The chips still work, without counts.
  segments: UserSegments | undefined
  onChange: (segment: UserSegment | null) => void
}

export default function SegmentChips({ active, segments, onChange }: Props) {
  const chips = [{ id: null, label: 'All users' }, ...SEGMENTS]

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map(({ id, label }) => (
        <button
          key={label}
          onClick={() => onChange(id)}
          className={`rounded-full border px-3 py-1 text-sm font-medium ${
            active === id ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {label}
          {id && segments && <span className="ml-1.5 text-gray-500">{segments[id].length}</span>}
        </button>
      ))}
    </div>
  )
}

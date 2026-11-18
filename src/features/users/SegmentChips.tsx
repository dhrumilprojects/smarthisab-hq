import Chip from '../../components/ui/Chip'
import { FILTERS, type UserFilter } from './segments'

type Props = {
  // null shows all users
  active: UserFilter | null
  // Missing while loading or when it failed. The chips still work, without counts.
  counts: Partial<Record<UserFilter, number>>
  onChange: (filter: UserFilter | null) => void
}

export default function SegmentChips({ active, counts, onChange }: Props) {
  const chips = [{ id: null, label: 'All users' }, ...FILTERS]

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map(({ id, label }) => (
        <Chip key={label} selected={active === id} onClick={() => onChange(id)}>
          {label}
          {id && counts[id] !== undefined && <span className="ml-1.5 text-gray-500">{counts[id]}</span>}
        </Chip>
      ))}
    </div>
  )
}

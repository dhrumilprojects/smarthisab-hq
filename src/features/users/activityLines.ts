import type { ActivityEntry, ActivityFilter, ActivityKind } from '../../data/types'
import { dayKey } from './istFormat'

// The filter chips, the same on a user's Activity tab and the Activity page
export const FILTERS: { label: string; type: ActivityFilter['type'] }[] = [
  { label: 'All', type: undefined },
  { label: 'Projects', type: 'projects' },
  { label: 'Expenses', type: 'expenses' },
  { label: 'Income', type: 'income' },
  { label: 'People', type: 'people' },
  { label: 'Plan', type: 'plan' },
]

export const PLURALS: Record<ActivityKind, string> = {
  project: 'projects',
  expense: 'expenses',
  income: 'client payments',
  vendor: 'vendors',
  labour: 'labourers',
  plan: 'plan events',
}

const BURST_SIZE = 3
const BURST_GAP = 30 * 60 * 1000

// Splits newest-first entries into lines. 3 or more of the same kind, entered within 30 minutes
// of each other on the same day, become one burst line. In the all-users feed they must also be by the same user.
export function toLines<T extends ActivityEntry & { userId?: string }>(entries: T[]) {
  const lines: T[][] = []
  let run: T[] = []
  const flush = () => {
    if (run.length >= BURST_SIZE) lines.push(run)
    else lines.push(...run.map((entry) => [entry]))
    run = []
  }
  for (const entry of entries) {
    const previous = run[run.length - 1]
    const continues =
      previous &&
      previous.kind === entry.kind &&
      previous.userId === entry.userId &&
      previous.kind !== 'plan' &&
      dayKey(previous.at) === dayKey(entry.at) &&
      previous.at.getTime() - entry.at.getTime() <= BURST_GAP
    if (!continues) flush()
    run.push(entry)
  }
  flush()
  return lines
}

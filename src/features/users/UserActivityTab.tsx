import { useState, type ReactNode } from 'react'
import Button from '../../components/ui/Button'
import Chip from '../../components/ui/Chip'
import LoadState from '../../components/ui/LoadState'
import type { ActivityEntry, ActivityFilter, ActivityKind } from '../../data/types'
import { dayKey, formatDate, formatDayHeading, formatShortDate, formatTime, formatUsualTime } from './istFormat'
import { useUserActivity, useUserActivitySummary } from './useUsers'

const FILTERS: { label: string; type: ActivityFilter['type'] }[] = [
  { label: 'All', type: undefined },
  { label: 'Projects', type: 'projects' },
  { label: 'Expenses', type: 'expenses' },
  { label: 'Income', type: 'income' },
  { label: 'People', type: 'people' },
  { label: 'Plan', type: 'plan' },
]

const PLURALS: Record<ActivityKind, string> = {
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
// of each other on the same day, become one burst line.
function toLines(entries: ActivityEntry[]) {
  const lines: ActivityEntry[][] = []
  let run: ActivityEntry[] = []
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
      previous.kind !== 'plan' &&
      dayKey(previous.at) === dayKey(entry.at) &&
      previous.at.getTime() - entry.at.getTime() <= BURST_GAP
    if (!continues) flush()
    run.push(entry)
  }
  flush()
  return lines
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-gray-900">{children}</p>
    </div>
  )
}

function Summary({ userId }: { userId: string }) {
  const { data, isError } = useUserActivitySummary(userId)

  if (isError) return <p className="text-sm text-red-600">Couldn't load the summary</p>
  if (!data) return <div className="h-28 animate-pulse rounded-lg bg-gray-100" />

  const { totals, last7Days, last30Days } = data
  return (
    <div className="space-y-4 rounded-lg bg-gray-50 p-4">
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
        <Stat label="Projects">{totals.projects}</Stat>
        <Stat label="Expenses">{totals.expenses}</Stat>
        <Stat label="Client payments">{totals.income}</Stat>
        <Stat label="Vendors">{totals.vendors}</Stat>
        <Stat label="Labourers">{totals.labours}</Stat>
      </div>
      <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4">
        <Stat label="Last 7 days">
          {last7Days.records} records · {last7Days.activeDays} {last7Days.activeDays === 1 ? 'day' : 'days'} active
        </Stat>
        <Stat label="Last 30 days">
          {last30Days.records} records · {last30Days.activeDays} {last30Days.activeDays === 1 ? 'day' : 'days'} active
        </Stat>
        <Stat label="Usual time of entry">
          {data.usualHour === null ? 'Not enough entries yet' : formatUsualTime(data.usualHour)}
        </Stat>
        <Stat label="Last opened the app">
          {data.lastActiveAt ? `${formatDate(data.lastActiveAt)}, ${formatTime(data.lastActiveAt)}` : 'Not tracked yet'}
        </Stat>
      </div>
    </div>
  )
}

function EntryText({ entry }: { entry: ActivityEntry }) {
  return (
    <>
      <span className="text-gray-900">{entry.label}</span>
      {[
        entry.category,
        entry.projectName,
        entry.amount !== null && `₹${entry.amount.toLocaleString('en-IN')}`,
        entry.forDate && `for ${formatShortDate(entry.forDate)}`,
      ]
        .filter(Boolean)
        .map((part, i) => (
          <span key={i}> · {part}</span>
        ))}
    </>
  )
}

function Line({ entries }: { entries: ActivityEntry[] }) {
  const [open, setOpen] = useState(false)
  const first = entries[0]

  if (entries.length === 1) {
    return (
      <li className="text-sm text-gray-600">
        <span className="inline-block w-18 text-gray-500 tabular-nums">{formatTime(first.at)}</span>
        <EntryText entry={first} />
      </li>
    )
  }

  // Newest first, so the last entry is the earliest
  const earliest = entries[entries.length - 1]
  return (
    <li className="text-sm text-gray-600">
      <button onClick={() => setOpen(!open)} className="text-left hover:text-gray-900">
        <span className="inline-block w-18 text-gray-500 tabular-nums">{formatTime(first.at)}</span>
        <span className="font-medium text-gray-900">
          {entries.length} {PLURALS[first.kind]} added between {formatTime(earliest.at)} and {formatTime(first.at)}
        </span>
        <span className="ml-1 text-brand-800">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <ul className="mt-2 ml-18 space-y-1.5 border-l border-gray-200 pl-3">
          {entries.map((entry) => (
            <li key={entry.id}>
              <span className="inline-block w-18 text-gray-500 tabular-nums">{formatTime(entry.at)}</span>
              <EntryText entry={entry} />
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

function Log({ userId, filter }: { userId: string; filter: ActivityFilter }) {
  const { data, isError, hasNextPage, fetchNextPage, isFetchingNextPage, isFetchNextPageError } = useUserActivity(
    userId,
    filter,
  )

  return (
    <LoadState
      data={data?.pages.flatMap((page) => page.entries)}
      error={isError && !data}
      errorMessage="Couldn't load activity"
      emptyMessage={filter.type ? 'Nothing of this kind yet.' : 'No activity yet.'}
    >
      {(entries) => {
        const days: ActivityEntry[][][] = []
        for (const line of toLines(entries)) {
          const day = days[days.length - 1]
          if (day && dayKey(day[0][0].at) === dayKey(line[0].at)) day.push(line)
          else days.push([line])
        }

        return (
          <div className="space-y-6">
            {days.map((lines) => (
              <section key={dayKey(lines[0][0].at)}>
                <h3 className="mb-2 text-xs font-semibold text-gray-500 uppercase">{formatDayHeading(lines[0][0].at)}</h3>
                <ul className="space-y-2">
                  {lines.map((line) => (
                    <Line key={line[0].id} entries={line} />
                  ))}
                </ul>
              </section>
            ))}
            {isFetchNextPageError && <p className="text-sm text-red-600">Couldn't load more activity</p>}
            {hasNextPage && (
              <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? 'Loading…' : 'Load more'}
              </Button>
            )}
          </div>
        )
      }}
    </LoadState>
  )
}

export default function UserActivityTab({ userId }: { userId: string }) {
  const [filter, setFilter] = useState<ActivityFilter>({})

  return (
    <div className="space-y-6">
      <Summary userId={userId} />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ label, type }) => (
          <Chip key={label} selected={filter.type === type} onClick={() => setFilter(type ? { type } : {})}>
            {label}
          </Chip>
        ))}
      </div>

      <Log userId={userId} filter={filter} />
    </div>
  )
}

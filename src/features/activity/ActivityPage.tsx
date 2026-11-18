import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import Chip from '../../components/ui/Chip'
import LoadState from '../../components/ui/LoadState'
import PageHeader from '../../components/ui/PageHeader'
import type { ActivityFeedFilter, FeedEntry } from '../../data/types'
import { FILTERS, PLURALS, toLines } from '../users/activityLines'
import { formatDate, formatTime } from '../users/istFormat'
import { timeAgo } from './timeAgo'
import { useActivityFeed, useNow } from './useActivityFeed'

// How far down the page counts as "scrolled down"
const TOP_MARGIN = 80

function lowerFirst(text: string) {
  return text[0].toLowerCase() + text.slice(1)
}

function Line({ entries, now }: { entries: FeedEntry[]; now: number }) {
  const first = entries[0]
  // Newest first, so the last entry is the earliest
  const earliest = entries[entries.length - 1]

  const text =
    entries.length === 1
      ? [
          lowerFirst(first.label),
          first.category,
          first.projectName,
          first.amount !== null && `₹${first.amount.toLocaleString('en-IN')}`,
        ]
      : [`added ${entries.length} ${PLURALS[first.kind]}`, `${formatTime(earliest.at)} to ${formatTime(first.at)}`]

  return (
    <li>
      {/* The user's panel opens over the Users page, and closing it comes back here */}
      <Link
        to={`/users?user=${first.userId}`}
        state={{ panel: true }}
        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50"
      >
        <Avatar name={first.userName} />
        <span className="min-w-0 flex-1">
          <span className="font-medium text-gray-900">{first.userName}</span>
          {text.filter(Boolean).map((part, i) => (
            <span key={i}> · {part}</span>
          ))}
        </span>
        <time
          dateTime={first.at.toISOString()}
          title={`${formatDate(first.at)}, ${formatTime(first.at)} IST`}
          className="shrink-0 text-xs text-gray-500"
        >
          {timeAgo(first.at, now)}
        </time>
      </Link>
    </li>
  )
}

function Feed({ filter, now }: { filter: ActivityFeedFilter; now: number }) {
  const { entries, isError, hasMore, loadMore, isLoadingMore, isLoadMoreError } = useActivityFeed(filter)

  // While the page is scrolled down, entries newer than `heldAt` wait behind the "new" pill
  const [heldAt, setHeldAt] = useState<number | null>(null)
  const newest = useRef(0)
  const newestAt = entries?.[0]?.at.getTime() ?? 0

  useEffect(() => {
    newest.current = newestAt
  }, [newestAt])

  useEffect(() => {
    function onScroll() {
      const atTop = window.scrollY < TOP_MARGIN
      setHeldAt((current) => (atTop ? null : (current ?? newest.current)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const shown = heldAt === null ? entries : entries?.filter((entry) => entry.at.getTime() <= heldAt)
  const waiting = (entries?.length ?? 0) - (shown?.length ?? 0)

  return (
    <>
      {waiting > 0 && (
        <div className="sticky top-4 z-10 flex justify-center">
          <Button variant="primary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            {waiting} new
          </Button>
        </div>
      )}
      <div className="rounded-xl border border-gray-200 bg-white">
        <LoadState
          data={shown}
          error={isError && !entries}
          errorMessage="Couldn't load activity"
          emptyMessage="No activity yet"
        >
          {(lines) => (
            <ul className="divide-y divide-gray-100">
              {toLines(lines).map((line) => (
                <Line key={line[0].id} entries={line} now={now} />
              ))}
            </ul>
          )}
        </LoadState>
      </div>
      {isLoadMoreError && <p className="text-sm text-red-600">Couldn't load more activity</p>}
      {hasMore && heldAt === null && (
        <div>
          <Button onClick={loadMore} disabled={isLoadingMore}>
            {isLoadingMore ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </>
  )
}

export default function ActivityPage() {
  const now = useNow()
  const [filter, setFilter] = useState<ActivityFeedFilter>({})

  return (
    <div className="space-y-6">
      <PageHeader title="Activity" description="What everyone is doing in the app, live." />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ label, type }) => (
          <Chip
            key={label}
            selected={filter.type === type}
            onClick={() => setFilter({ ...filter, type })}
          >
            {label}
          </Chip>
        ))}
        <span className="mx-1 w-px bg-gray-200" />
        <Chip selected={!!filter.showInternal} onClick={() => setFilter({ ...filter, showInternal: !filter.showInternal })}>
          Show test accounts
        </Chip>
      </div>

      {/* A new filter starts a fresh feed */}
      <Feed key={`${filter.type}-${filter.showInternal}`} filter={filter} now={now} />
    </div>
  )
}

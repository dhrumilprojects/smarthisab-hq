import { useEffect, useRef, useState } from 'react'
import { activityRepo } from '../../data'
import type { ActivityFeedFilter, FeedEntry } from '../../data/types'

// Newest first. An entry already in the list is replaced, not repeated.
function merge(current: FeedEntry[], incoming: FeedEntry[]) {
  const byId = Object.fromEntries([...current, ...incoming].map((entry) => [entry.id, entry]))
  return Object.values(byId).sort((a, b) => b.at.getTime() - a.at.getTime())
}

// Everyone's latest entries, kept up to date while the browser tab is visible. Call it with a new `filter`
// object only when the filter changes, and remount to reset.
export function useActivityFeed(filter: ActivityFeedFilter) {
  // undefined while the first page loads
  const [entries, setEntries] = useState<FeedEntry[]>()
  const [isError, setIsError] = useState(false)
  // Where older entries start. null when there are none.
  const [before, setBefore] = useState<Date | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isLoadMoreError, setIsLoadMoreError] = useState(false)
  // Once older pages are loaded, the live window no longer decides where "Load more" starts
  const loadedOlder = useRef(false)

  // Listen only while the tab is visible, so a forgotten tab doesn't keep reading
  useEffect(() => {
    let stop: (() => void) | null = null

    function sync() {
      if (document.visibilityState === 'visible' && !stop) {
        stop = activityRepo.subscribeToActivity(
          filter,
          (page) => {
            setIsError(false)
            setEntries((current) => merge(current ?? [], page.entries))
            if (!loadedOlder.current) setBefore(page.nextBefore)
          },
          () => setIsError(true),
        )
      } else if (document.visibilityState !== 'visible') {
        stop?.()
        stop = null
      }
    }

    sync()
    document.addEventListener('visibilitychange', sync)
    return () => {
      document.removeEventListener('visibilitychange', sync)
      stop?.()
    }
  }, [filter])

  async function loadMore() {
    if (!before) return
    setIsLoadingMore(true)
    setIsLoadMoreError(false)
    try {
      const page = await activityRepo.getActivityBefore(filter, before)
      loadedOlder.current = true
      setEntries((current) => merge(current ?? [], page.entries))
      setBefore(page.nextBefore)
    } catch {
      setIsLoadMoreError(true)
    } finally {
      setIsLoadingMore(false)
    }
  }

  return { entries, isError, hasMore: before !== null, loadMore, isLoadingMore, isLoadMoreError }
}

// The current time, refreshed once a minute, so every "2 min ago" on the page updates from one timer
export function useNow() {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60 * 1000)
    return () => clearInterval(timer)
  }, [])
  return now
}

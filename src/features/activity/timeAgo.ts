import { formatShortDate, formatTime } from '../users/istFormat'

// "just now", "2 min ago", "1 hr ago", then the day and time ("15 Nov, 7:42 pm")
export function timeAgo(date: Date, now: number) {
  const minutes = Math.floor((now - date.getTime()) / (60 * 1000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} hr ago`
  return `${formatShortDate(date)}, ${formatTime(date)}`
}

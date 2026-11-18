// Everything in the user panel is shown in IST, whatever the viewer's own time zone
const timeZone = 'Asia/Kolkata'

// "7:42 pm"
export function formatTime(date: Date) {
  return date.toLocaleTimeString('en-IN', { timeZone, hour: 'numeric', minute: '2-digit' }).toLowerCase()
}

// "15 Nov 2026"
export function formatDate(date: Date) {
  return date.toLocaleDateString('en-IN', { timeZone, day: 'numeric', month: 'short', year: 'numeric' })
}

// "9 Nov"
export function formatShortDate(date: Date) {
  return date.toLocaleDateString('en-IN', { timeZone, day: 'numeric', month: 'short' })
}

// "2026-11-15", for grouping by IST day
export function dayKey(date: Date) {
  return date.toLocaleDateString('en-CA', { timeZone })
}

// "Today", "Yesterday" or "Sun, 15 Nov 2026"
export function formatDayHeading(date: Date) {
  const now = Date.now()
  if (dayKey(date) === dayKey(new Date(now))) return 'Today'
  if (dayKey(date) === dayKey(new Date(now - 24 * 60 * 60 * 1000))) return 'Yesterday'
  return date.toLocaleDateString('en-IN', { timeZone, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

// IST start hour of a 2-hour window → "Mostly evenings, 7–9 pm"
export function formatUsualTime(hour: number) {
  const end = (hour + 2) % 24
  const clock = (h: number) => h % 12 || 12
  const suffix = (h: number) => (h < 12 ? 'am' : 'pm')
  const range =
    suffix(hour) === suffix(end)
      ? `${clock(hour)}–${clock(end)} ${suffix(end)}`
      : `${clock(hour)} ${suffix(hour)}–${clock(end)} ${suffix(end)}`
  const part = hour >= 5 && hour < 12 ? 'mornings' : hour >= 12 && hour < 17 ? 'afternoons' : hour >= 17 && hour < 21 ? 'evenings' : 'nights'
  return `Mostly ${part}, ${range}`
}

// Whole days until a plan ends. 0 or less once it has ended.
export function daysLeft(endsAt: Date, now: number) {
  return Math.ceil((endsAt.getTime() - now) / (24 * 60 * 60 * 1000))
}

// "2026-11-15" (a date input's value) → midnight IST that day
export function fromDayKey(value: string) {
  return new Date(`${value}T00:00:00+05:30`)
}

// "today", "yesterday" or "3 days ago", counted in IST days
export function daysAgo(date: Date, now: number) {
  const days = Math.round((Date.parse(dayKey(new Date(now))) - Date.parse(dayKey(date))) / (24 * 60 * 60 * 1000))
  return days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`
}

// Activation and conversion by sign-up cohort, read from Firestore (SMA-26).
// Read-only: it only calls get() and listUsers(). Run it with a read-only service account.
// Usage and metric definitions: see README.md next to this file.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, Timestamp, type DocumentData } from 'firebase-admin/firestore'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const IST_OFFSET = 5.5 * HOUR
const ACTIVATION_WINDOW = DAY
const CONVERSION_GRACE = 14 * DAY
const HABIT_WINDOW = 30 * DAY
const SMALL_COHORT = 20

const { values: args } = parseArgs({
  options: {
    from: { type: 'string' }, // IST date, inclusive, e.g. 2026-09-29
    to: { type: 'string' }, // IST date, exclusive
    group: { type: 'string', default: 'week' }, // week | month
  },
})
if (args.group !== 'week' && args.group !== 'month') throw new Error('--group must be week or month')

const outDir = new URL('./out/', import.meta.url)
const excludeFile = new URL('./exclude.txt', import.meta.url)
const now = Date.now()

// "2026-09-29" as midnight IST, in UTC ms
function istDate(date: string) {
  return Date.parse(`${date}T00:00:00+05:30`)
}

// UTC getters on a shifted Date read IST wall-clock values (IST has no daylight saving)
function istDay(ms: number) {
  return new Date(ms + IST_OFFSET).toISOString().slice(0, 10)
}

function cohortOf(ms: number) {
  const ist = new Date(ms + IST_OFFSET)
  if (args.group === 'month') return ist.toISOString().slice(0, 7)
  const daysSinceMonday = (ist.getUTCDay() + 6) % 7
  return istDay(ms - daysSinceMonday * DAY)
}

function toMs(value: unknown) {
  return value instanceof Timestamp ? value.toMillis() : null
}

function pct(part: number, total: number) {
  return total ? ((part / total) * 100).toFixed(1) : ''
}

function median(numbers: number[]) {
  if (!numbers.length) return ''
  const sorted = numbers.toSorted((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return String(sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2)
}

function toCsv(rows: Record<string, string | number>[]) {
  if (!rows.length) return ''
  return [Object.keys(rows[0]), ...rows.map(Object.values)].map((row) => row.join(',')).join('\n') + '\n'
}

// Event times (server createdAt, ms) per user ID
async function timesByUser(name: string, keep: (data: DocumentData) => boolean = () => true) {
  const snapshot = await db.collection(name).select('userId', 'createdAt', 'status').get()
  const times: Record<string, number[]> = {}
  for (const doc of snapshot.docs) {
    const data = doc.data()
    const createdAt = toMs(data.createdAt)
    if (typeof data.userId !== 'string' || createdAt === null || !keep(data)) continue
    ;(times[data.userId] ??= []).push(createdAt)
  }
  return times
}

initializeApp({ credential: applicationDefault() })
const db = getFirestore()

// Auth creation time is the most reliable sign-up time: users.createdAt comes from the phone's clock
const authCreatedAt: Record<string, number> = {}
let pageToken: string | undefined
do {
  const page = await getAuth().listUsers(1000, pageToken)
  for (const user of page.users) authCreatedAt[user.uid] = Date.parse(user.metadata.creationTime)
  pageToken = page.pageToken
} while (pageToken)

const [usersSnap, subscriptionsSnap, hqUsersSnap, projects, expenses, payments] = await Promise.all([
  db.collection('users').select('email', 'createdAt').get(),
  db.collection('subscriptions').select('trialStartDate', 'trialEndDate').get(),
  db.collection('hq_users').get(),
  timesByUser('projects'),
  timesByUser('expenses'),
  timesByUser('payment_history', (data) => data.status === 'paid'),
])

// Internal and test accounts: HQ staff plus the emails or user IDs listed in exclude.txt
const excluded = new Set(hqUsersSnap.docs.map((doc) => doc.id.toLowerCase()))
if (existsSync(excludeFile)) {
  for (const line of readFileSync(excludeFile, 'utf8').split('\n')) {
    const entry = line.replace(/#.*/, '').trim().toLowerCase()
    if (entry) excluded.add(entry)
  }
}

const subscriptions = Object.fromEntries(subscriptionsSnap.docs.map((doc) => [doc.id, doc.data()]))
const from = args.from ? istDate(args.from) : -Infinity
const to = args.to ? istDate(args.to) : Infinity

const userRows = []
let skippedNoSignup = 0
let skippedExcluded = 0

for (const userDoc of usersSnap.docs) {
  const uid = userDoc.id
  const email = String(userDoc.get('email') ?? '').toLowerCase()
  if (excluded.has(uid.toLowerCase()) || (email && excluded.has(email))) {
    skippedExcluded++
    continue
  }

  const subscription = subscriptions[uid] ?? {}
  const createdAtString = userDoc.get('createdAt')
  const signup =
    authCreatedAt[uid] ??
    toMs(subscription.trialStartDate) ??
    (typeof createdAtString === 'string' ? Date.parse(createdAtString) : NaN)
  if (Number.isNaN(signup)) {
    skippedNoSignup++
    continue
  }
  if (signup < from || signup >= to) continue

  const firstWithin = (times: number[] | undefined, end: number) => (times ?? []).some((t) => t <= end)

  // Trial is 3 months from sign-up. Fall back to that if the subscription doc is missing.
  const fallbackTrialEnd = new Date(signup)
  fallbackTrialEnd.setMonth(fallbackTrialEnd.getMonth() + 3)
  const trialEnd = toMs(subscription.trialEndDate) ?? fallbackTrialEnd.getTime()
  const conversionKnown = trialEnd + CONVERSION_GRACE <= now

  const habitKnown = signup + HABIT_WINDOW <= now
  const habitDays = new Set(
    (expenses[uid] ?? []).filter((t) => t >= signup && t < signup + HABIT_WINDOW).map(istDay),
  ).size

  userRows.push({
    uid,
    cohort: cohortOf(signup),
    signup_ist: istDay(signup),
    project_24h: Number(firstWithin(projects[uid], signup + ACTIVATION_WINDOW)),
    expense_24h: Number(firstWithin(expenses[uid], signup + ACTIVATION_WINDOW)),
    trial_end_ist: istDay(trialEnd),
    paid_by_trial_end: conversionKnown ? Number(firstWithin(payments[uid], trialEnd + CONVERSION_GRACE)) : '',
    habit_days_30d: habitKnown ? habitDays : '',
  })
}

userRows.sort((a, b) => a.signup_ist.localeCompare(b.signup_ist))

const cohorts: Record<string, typeof userRows> = {}
for (const row of userRows) (cohorts[row.cohort] ??= []).push(row)

const cohortRows = Object.entries(cohorts).map(([cohort, rows]) => {
  const converted = rows.filter((row) => row.paid_by_trial_end !== '')
  const habit = rows.filter((row) => row.habit_days_30d !== '').map((row) => Number(row.habit_days_30d))
  return {
    cohort,
    users: rows.length,
    project_24h_pct: pct(rows.filter((row) => row.project_24h).length, rows.length),
    expense_24h_pct: pct(rows.filter((row) => row.expense_24h).length, rows.length),
    trial_ended_users: converted.length,
    paid_pct: pct(converted.filter((row) => row.paid_by_trial_end).length, converted.length),
    habit_users: habit.length,
    habit_median_days: median(habit),
    habit_3plus_days_pct: pct(habit.filter((days) => days >= 3).length, habit.length),
    small_cohort: rows.length < SMALL_COHORT ? 'yes' : '',
  }
})

mkdirSync(outDir, { recursive: true })
writeFileSync(new URL('cohorts.csv', outDir), toCsv(cohortRows))
writeFileSync(new URL('users.csv', outDir), toCsv(userRows))

console.log(`Run at ${new Date(now).toISOString()}, grouped by ${args.group}`)
console.log(`${userRows.length} users in range, ${skippedExcluded} excluded, ${skippedNoSignup} without a sign-up time`)
console.table(cohortRows)
console.log(`Wrote ${new URL('cohorts.csv', outDir).pathname} and users.csv`)

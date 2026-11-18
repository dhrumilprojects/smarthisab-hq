import { collection, getCountFromServer, getDocs, query, Timestamp, where } from 'firebase/firestore'
import { z } from 'zod'
import type { ActiveDayBuckets, User, UserSegments } from '../types'
import { db } from './app'
import { toUser } from './user'

const DAY = 24 * 60 * 60 * 1000
const IST_OFFSET = 5.5 * 60 * 60 * 1000
// Expenses newer than this are read in one query. Older activity is only checked with a count.
const WINDOW_DAYS = 60
const ACTIVE_WINDOW_DAYS = 14

// Only who and when. Zod drops amounts and names.
const expenseSchema = z.object({ userId: z.string(), createdAt: z.instanceof(Timestamp) })

// UTC getters on a shifted Date read IST wall-clock values (IST has no daylight saving)
function istDay(ms: number) {
  return new Date(ms + IST_OFFSET).toISOString().slice(0, 10)
}

// Distinct IST days with an expense in the last 14 days. Shared by the Users segments and the Dashboard.
export function activeDayCount(times: number[], now: number) {
  return new Set(times.filter((time) => time >= now - ACTIVE_WINDOW_DAYS * DAY).map(istDay)).size
}

// Newest sign-up first. Users without a sign-up date go last.
function bySignup(a: User, b: User) {
  return (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
}

// Uses the server `createdAt` of each expense, not its `date` field, which users backdate
export async function getUserSegments(): Promise<UserSegments> {
  const now = Date.now()
  const [userDocs, subscriptionDocs, recentExpenses] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'subscriptions')),
    getDocs(query(collection(db, 'expenses'), where('createdAt', '>=', Timestamp.fromMillis(now - WINDOW_DAYS * DAY)))),
  ])

  // Subscription doc IDs are user IDs
  const subscriptions = Object.fromEntries(subscriptionDocs.docs.map((subscription) => [subscription.id, subscription.data()]))
  const users = userDocs.docs.map((userDoc) => toUser(userDoc.id, userDoc.data(), subscriptions[userDoc.id]))

  // Entry times of each user's expenses in the window
  const times: Record<string, number[]> = {}
  for (const expense of recentExpenses.docs) {
    const parsed = expenseSchema.safeParse(expense.data())
    if (parsed.success) (times[parsed.data.userId] ??= []).push(parsed.data.createdAt.toMillis())
  }
  const lastExpense = (user: User) => Math.max(...times[user.id])
  const activeDays = (user: User) => activeDayCount(times[user.id], now)

  // No expense in the window: count to tell lapsed users from those who never logged one
  const quiet = users.filter((user) => !times[user.id])
  const everLogged = await Promise.all(
    quiet.map(
      async (user) =>
        (await getCountFromServer(query(collection(db, 'expenses'), where('userId', '==', user.id)))).data().count > 0,
    ),
  )

  const recent = users.filter((user) => times[user.id])
  const trialEndsAt = (user: User) => user.subscription?.endsAt.getTime() ?? 0

  return {
    // Most active days first
    active: recent
      .filter((user) => activeDays(user) >= 3)
      .sort((a, b) => activeDays(b) - activeDays(a) || lastExpense(b) - lastExpense(a)),
    // Most recently lapsed first, then those who stopped before the window
    inactive: [
      ...recent.filter((user) => lastExpense(user) < now - 7 * DAY).sort((a, b) => lastExpense(b) - lastExpense(a)),
      ...quiet.filter((_, i) => everLogged[i]).sort(bySignup),
    ],
    not_activated: quiet.filter((_, i) => !everLogged[i]).sort(bySignup),
    // Soonest first
    trial_ending: users
      .filter((user) => user.subscription?.plan === 'trial' && trialEndsAt(user) > now && trialEndsAt(user) <= now + 7 * DAY)
      .sort((a, b) => trialEndsAt(a) - trialEndsAt(b)),
  }
}

// Users by number of active days. HQ staff are left out. Users with no active days are not counted.
export async function getActiveDayBuckets(): Promise<ActiveDayBuckets> {
  const now = Date.now()
  const [userDocs, staffDocs, recentExpenses] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'hq_users')),
    getDocs(query(collection(db, 'expenses'), where('createdAt', '>=', Timestamp.fromMillis(now - ACTIVE_WINDOW_DAYS * DAY)))),
  ])

  const staffEmails = staffDocs.docs.map((staff) => staff.id.toLowerCase())
  const staffIds = userDocs.docs
    .filter((userDoc) => staffEmails.includes(toUser(userDoc.id, userDoc.data(), null).email.toLowerCase()))
    .map((userDoc) => userDoc.id)

  const times: Record<string, number[]> = {}
  for (const expense of recentExpenses.docs) {
    const parsed = expenseSchema.safeParse(expense.data())
    if (parsed.success && !staffIds.includes(parsed.data.userId)) (times[parsed.data.userId] ??= []).push(parsed.data.createdAt.toMillis())
  }

  const days = Object.values(times).map((userTimes) => activeDayCount(userTimes, now))
  return {
    active: days.filter((count) => count >= 3).length,
    twoDays: days.filter((count) => count === 2).length,
    oneDay: days.filter((count) => count === 1).length,
  }
}

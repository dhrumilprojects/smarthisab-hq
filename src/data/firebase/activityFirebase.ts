import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  Timestamp,
  where,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { z } from 'zod'
import type { ActivityCounts, ActivityEntry, ActivityFilter, ActivityPage, ActivitySummary } from '../types'
import { db } from './app'
import { toSubscription } from './subscription'

const PAGE_SIZE = 50
const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const IST_OFFSET = 5.5 * HOUR

// Collections of records users add. Each doc has `userId` and a server `createdAt`.
export const RECORDS = {
  projects: { kind: 'project', label: 'Added a project' },
  expenses: { kind: 'expense', label: 'Added an expense' },
  payments: { kind: 'income', label: 'Added a client payment' },
  vendors: { kind: 'vendor', label: 'Added a vendor' },
  labours: { kind: 'labour', label: 'Added a labourer' },
} as const
export type RecordCollection = keyof typeof RECORDS
export const RECORD_COLLECTIONS = Object.keys(RECORDS) as RecordCollection[]

export const COLLECTIONS_BY_TYPE: Record<NonNullable<ActivityFilter['type']>, RecordCollection[]> = {
  projects: ['projects'],
  expenses: ['expenses'],
  income: ['payments'],
  people: ['vendors', 'labours'],
  plan: [],
}

// Only the fields the log shows. Zod drops the rest, so amounts and people's names never leave this file.
const recordSchema = z.object({
  createdAt: z.instanceof(Timestamp),
  projectId: z.string().optional(),
  // Expense category, or a vendor's or labourer's trade
  category: z.string().optional(),
  // The day an expense happened, "DD/MM/YYYY"
  date: z.string().optional(),
  // Set on payments made against an expense. Those are money paid out, not client payments.
  expenseId: z.string().optional(),
})

// Position in each source: the createdAt of the last entry read, or 'done'. Missing means start at the top.
type Position = [seconds: number, nanoseconds: number] | 'done'
type Cursor = Partial<Record<RecordCollection | 'plan', Position>>

// `entry` is null for docs the log skips (payments against an expense). They still move the cursor.
export type Item = { ts: Timestamp; entry: ActivityEntry | null }

function compare(a: Timestamp, b: Timestamp) {
  return a.seconds - b.seconds || a.nanoseconds - b.nanoseconds
}

// UTC getters on a shifted Date read IST wall-clock values (IST has no daylight saving)
function istDay(ms: number) {
  return new Date(ms + IST_OFFSET).toISOString().slice(0, 10)
}

// "15/11/2026" (or "15/11/26") as midnight IST
function parseDay(value: string | undefined) {
  const match = value?.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (!match) return null
  const year = Number(match[3]) < 100 ? Number(match[3]) + 2000 : Number(match[3])
  return new Date(Date.UTC(year, Number(match[2]) - 1, Number(match[1])) - IST_OFFSET)
}

function capitalize(value: string | undefined) {
  return value ? value[0].toUpperCase() + value.slice(1) : null
}

export function toItem(name: RecordCollection, snap: QueryDocumentSnapshot, projectNames: Record<string, string>): Item | null {
  const parsed = recordSchema.safeParse(snap.data())
  if (!parsed.success) return null
  const record = parsed.data
  if (name === 'payments' && record.expenseId) return { ts: record.createdAt, entry: null }

  const at = record.createdAt.toDate()
  const day = name === 'expenses' ? parseDay(record.date) : null
  return {
    ts: record.createdAt,
    entry: {
      id: `${name}/${snap.id}`,
      kind: RECORDS[name].kind,
      at,
      label: RECORDS[name].label,
      category: name === 'expenses' || name === 'vendors' || name === 'labours' ? capitalize(record.category) : null,
      projectName: projectNames[name === 'projects' ? snap.id : (record.projectId ?? '')] ?? null,
      forDate: day && istDay(day.getTime()) !== istDay(at.getTime()) ? day : null,
      amount: null,
    },
  }
}

async function getProjectNames(userId: string) {
  const snapshot = await getDocs(query(collection(db, 'projects'), where('userId', '==', userId)))
  return Object.fromEntries(snapshot.docs.map((project) => [project.id, String(project.get('title') ?? 'Untitled project')]))
}

export function planItem(id: string, ts: Timestamp, label: string, amount: number | null = null): Item {
  return {
    ts,
    entry: { id: `plan/${id}`, kind: 'plan', at: ts.toDate(), label, category: null, projectName: null, forDate: null, amount },
  }
}

// A paid `payment_history` doc as a plan event. Null for unpaid ones.
export function paymentItem(payment: QueryDocumentSnapshot): Item | null {
  const createdAt = payment.get('createdAt')
  if (payment.get('status') !== 'paid' || !(createdAt instanceof Timestamp)) return null
  const amount = Number(payment.get('amount'))
  return planItem(
    payment.id,
    createdAt,
    payment.get('type') === 'renewal' ? 'Plan renewed' : 'Plan paid',
    // Stored in paise
    Number.isFinite(amount) ? amount / 100 : null,
  )
}

// A user has only a few plan events, so they're all read at once
async function getPlanItems(userId: string) {
  const [subscription, history, orders] = await Promise.all([
    getDoc(doc(db, 'subscriptions', userId)),
    getDocs(query(collection(db, 'payment_history'), where('userId', '==', userId))),
    getDocs(query(collection(db, 'payment_orders'), where('userId', '==', userId))),
  ])
  const items: Item[] = []

  const trialStart = subscription.get('trialStartDate')
  if (trialStart instanceof Timestamp) items.push(planItem('trial', trialStart, 'Trial started'))

  const plan = toSubscription(subscription.data())
  if (plan && plan.endsAt.getTime() < Date.now()) {
    items.push(planItem('expired', Timestamp.fromDate(plan.endsAt), plan.plan === 'paid' ? 'Plan expired' : 'Trial ended'))
  }

  const paidOrders = new Set<unknown>()
  for (const payment of history.docs) {
    const item = paymentItem(payment)
    if (!item) continue
    paidOrders.add(payment.get('orderId'))
    items.push(item)
  }

  for (const order of orders.docs) {
    const createdAt = order.get('createdAt')
    if (order.get('status') !== 'created' || paidOrders.has(order.id) || !(createdAt instanceof Timestamp)) continue
    items.push(planItem(order.id, createdAt, 'Checkout started, not paid'))
  }

  return items
}

// Reads the next batch from each collection and merges them newest first. Each collection keeps its own
// position in the cursor, so the next page picks up exactly where this one stopped.
async function readPage(
  userId: string,
  names: RecordCollection[],
  planItems: Item[],
  projectNames: Record<string, string>,
  positions: Cursor,
) {
  const batches = await Promise.all(
    names.map(async (name) => {
      const position = positions[name]
      if (position === 'done') return { name, items: [], full: false }
      const snapshot = await getDocs(
        query(
          collection(db, name),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          ...(position ? [startAfter(new Timestamp(...position))] : []),
          limit(PAGE_SIZE),
        ),
      )
      return {
        name,
        items: snapshot.docs.map((snap) => toItem(name, snap, projectNames)).filter((item) => item !== null),
        full: snapshot.size === PAGE_SIZE,
      }
    }),
  )

  const planPosition = positions.plan
  const plan =
    planPosition === 'done'
      ? []
      : planItems.filter((item) => !planPosition || compare(item.ts, new Timestamp(...planPosition)) < 0)

  // A full batch may have older docs that weren't read yet, so only entries at or after
  // the newest such boundary are safe to show now
  const floor = batches
    .filter((batch) => batch.full && batch.items.length)
    .map((batch) => batch.items[batch.items.length - 1].ts)
    .sort(compare)
    .at(-1)

  const page = [...batches.flatMap((batch) => batch.items), ...plan]
    .filter((item) => item.entry && (!floor || compare(item.ts, floor) >= 0))
    .sort((a, b) => compare(b.ts, a.ts))
    .slice(0, PAGE_SIZE)

  // Everything at or after the cutoff has been read. No cutoff means every source is finished.
  const cutoff = page.length === PAGE_SIZE ? page[PAGE_SIZE - 1].ts : floor
  const next: Cursor = { ...positions }
  for (const batch of batches) {
    const read = cutoff ? batch.items.filter((item) => compare(item.ts, cutoff) >= 0) : batch.items
    if (!batch.full && read.length === batch.items.length) next[batch.name] = 'done'
    else if (read.length) next[batch.name] = [read[read.length - 1].ts.seconds, read[read.length - 1].ts.nanoseconds]
  }
  next.plan = cutoff && plan.some((item) => compare(item.ts, cutoff) < 0) ? [cutoff.seconds, cutoff.nanoseconds] : 'done'

  return { entries: page.map((item) => item.entry!), next }
}

export async function getUserActivity(userId: string, filter: ActivityFilter, cursor?: string): Promise<ActivityPage> {
  const names = filter.type ? COLLECTIONS_BY_TYPE[filter.type] : RECORD_COLLECTIONS
  const [projectNames, planItems] = await Promise.all([
    getProjectNames(userId),
    !filter.type || filter.type === 'plan' ? getPlanItems(userId) : [],
  ])

  let positions: Cursor = cursor ? JSON.parse(cursor) : {}
  let entries: ActivityEntry[] = []
  let hasMore = true
  // A page comes back empty when a whole batch was skipped payments, so read on until there's something to show
  while (!entries.length && hasMore) {
    ;({ entries, next: positions } = await readPage(userId, names, planItems, projectNames, positions))
    hasMore = [...names, 'plan' as const].some((name) => positions[name] !== 'done')
  }

  return { entries, nextCursor: hasMore ? JSON.stringify(positions) : null }
}

function counts(times: number[], days: number): ActivityCounts {
  const recent = times.filter((time) => time >= Date.now() - days * DAY)
  return { records: recent.length, activeDays: new Set(recent.map(istDay)).size }
}

// IST hour that starts the busiest 2-hour window
function usualHour(times: number[]) {
  if (times.length < 10) return null
  const perHour = Array<number>(24).fill(0)
  for (const time of times) perHour[new Date(time + IST_OFFSET).getUTCHours()]++
  const windowCount = (hour: number) => perHour[hour] + perHour[(hour + 1) % 24]
  return perHour.reduce((best, _, hour) => (windowCount(hour) > windowCount(best) ? hour : best), 0)
}

// SMA-34 isn't live yet, so accept either a Timestamp or an ISO string
const lastActiveSchema = z
  .union([z.instanceof(Timestamp).transform((value) => value.toDate()), z.iso.datetime({ offset: true }).transform((value) => new Date(value))])
  .nullable()
  .catch(null)

export async function getUserActivitySummary(userId: string): Promise<ActivitySummary> {
  const byUser = (name: string) => query(collection(db, name), where('userId', '==', userId))
  const [user, totals, expensePayments, recent] = await Promise.all([
    getDoc(doc(db, 'users', userId)),
    Promise.all(RECORD_COLLECTIONS.map(async (name) => (await getCountFromServer(byUser(name))).data().count)),
    getCountFromServer(query(byUser('payments'), where('expenseId', '!=', null))),
    Promise.all(
      RECORD_COLLECTIONS.map((name) =>
        getDocs(
          query(
            byUser(name),
            where('createdAt', '>=', Timestamp.fromMillis(Date.now() - 30 * DAY)),
            orderBy('createdAt', 'desc'),
          ),
        ),
      ),
    ),
  ])

  const times = recent.flatMap((snapshot, i) =>
    snapshot.docs
      .filter((record) => !(RECORD_COLLECTIONS[i] === 'payments' && record.get('expenseId')))
      .map((record) => (record.get('createdAt') as Timestamp).toMillis()),
  )
  const [projects, expenses, payments, vendors, labours] = totals

  return {
    totals: { projects, expenses, income: payments - expensePayments.data().count, vendors, labours },
    last7Days: counts(times, 7),
    last30Days: counts(times, 30),
    usualHour: usualHour(times),
    lastActiveAt: lastActiveSchema.parse(user.get('lastActiveAt') ?? null),
  }
}

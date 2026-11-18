import {
  collection,
  documentId,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import type { ActivityRepo } from '../activity'
import type { ActivityFeedFilter, FeedEntry, FeedPage } from '../types'
import { COLLECTIONS_BY_TYPE, paymentItem, RECORD_COLLECTIONS, toItem, type RecordCollection } from './activityFirebase'
import { db } from './app'
import { getStaffUserIds } from './segmentsFirebase'

const PAGE_SIZE = 50
// Firestore allows up to 30 values in an `in` query
const IN_LIMIT = 30

type Source = RecordCollection | 'payment_history'
type Raw = { source: Source; snap: QueryDocumentSnapshot; at: Timestamp }

function sourcesFor(filter: ActivityFeedFilter): Source[] {
  if (filter.type === 'plan') return ['payment_history']
  return filter.type ? COLLECTIONS_BY_TYPE[filter.type] : [...RECORD_COLLECTIONS, 'payment_history']
}

// Names are looked up once and kept, since the feed shows the same people and projects again and again
const userNames: Record<string, string> = {}
const projectNames: Record<string, string> = {}
let staffIds: Promise<string[]> | undefined

function getStaff() {
  staffIds ??= getStaffUserIds().catch((error) => {
    staffIds = undefined
    throw error
  })
  return staffIds
}

async function loadNames(name: 'users' | 'projects', ids: string[], cache: Record<string, string>, fallback: string) {
  const missing = [...new Set(ids)].filter((id) => !(id in cache))
  for (let i = 0; i < missing.length; i += IN_LIMIT) {
    const chunk = missing.slice(i, i + IN_LIMIT)
    const snapshot = await getDocs(query(collection(db, name), where(documentId(), 'in', chunk)))
    for (const id of chunk) cache[id] = fallback
    // Only the name or title is read, nothing else from these docs
    for (const found of snapshot.docs) cache[found.id] = String(found.get(name === 'users' ? 'name' : 'title') || fallback)
  }
}

// Newest `PAGE_SIZE` of what was read, as feed entries
async function toPage(raw: Raw[], filter: ActivityFeedFilter): Promise<FeedPage> {
  const newest = raw.sort((a, b) => b.at.seconds - a.at.seconds || b.at.nanoseconds - a.at.nanoseconds).slice(0, PAGE_SIZE)

  for (const { source, snap } of newest) {
    if (source === 'projects') projectNames[snap.id] = String(snap.get('title') || 'Untitled project')
  }
  const [staff] = await Promise.all([
    filter.showInternal ? ([] as string[]) : getStaff(),
    loadNames('users', newest.map(({ snap }) => String(snap.get('userId'))), userNames, 'Unknown user'),
    loadNames('projects', newest.map(({ snap }) => String(snap.get('projectId') ?? '')).filter(Boolean), projectNames, 'Untitled project'),
  ])

  const entries: FeedEntry[] = []
  for (const { source, snap } of newest) {
    const userId = snap.get('userId')
    if (typeof userId !== 'string' || staff.includes(userId)) continue
    const item = source === 'payment_history' ? paymentItem(snap) : toItem(source, snap, projectNames)
    if (item?.entry) entries.push({ ...item.entry, userId, userName: userNames[userId] })
  }

  // A full page may have older entries behind it
  return { entries, nextBefore: newest.length === PAGE_SIZE ? newest[PAGE_SIZE - 1].at.toDate() : null }
}

function toRaw(source: Source, docs: QueryDocumentSnapshot[]): Raw[] {
  return docs.flatMap((snap) => {
    const at = snap.get('createdAt')
    return at instanceof Timestamp ? [{ source, snap, at }] : []
  })
}

export const firebaseActivityRepo: ActivityRepo = {
  // One listener per collection. After the first read, only new docs cost reads.
  subscribeToActivity(filter, onChange, onError) {
    const sources = sourcesFor(filter)
    const latest: Partial<Record<Source, Raw[]>> = {}
    let closed = false
    // A slow name lookup must not overwrite a newer page
    let version = 0

    const stops = sources.map((source) =>
      onSnapshot(
        query(collection(db, source), orderBy('createdAt', 'desc'), limit(PAGE_SIZE)),
        (snapshot) => {
          latest[source] = toRaw(source, snapshot.docs)
          // Wait until every collection has answered once
          if (sources.some((name) => !latest[name])) return
          const mine = ++version
          toPage(sources.flatMap((name) => latest[name]!), filter).then(
            (page) => !closed && mine === version && onChange(page),
            () => !closed && onError(),
          )
        },
        () => !closed && onError(),
      ),
    )

    return () => {
      closed = true
      stops.forEach((stop) => stop())
    }
  },

  async getActivityBefore(filter, before) {
    let cursor = before
    // A page can be all hidden accounts or skipped payments, so read on until there's something to show
    for (;;) {
      const batches = await Promise.all(
        sourcesFor(filter).map(async (source) =>
          toRaw(
            source,
            (
              await getDocs(
                query(
                  collection(db, source),
                  where('createdAt', '<', Timestamp.fromDate(cursor)),
                  orderBy('createdAt', 'desc'),
                  limit(PAGE_SIZE),
                ),
              )
            ).docs,
          ),
        ),
      )
      const page = await toPage(batches.flat(), filter)
      if (page.entries.length || !page.nextBefore) return page
      cursor = page.nextBefore
    }
  },
}

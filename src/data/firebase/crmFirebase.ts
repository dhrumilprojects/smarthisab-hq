import {
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { z } from 'zod'
import type { CrmRepo } from '../crm'
import type { CrmContactChange, CrmStage, NoteOutcome, User } from '../types'
import { db } from './app'
import { toUser } from './user'

const DAY = 24 * 60 * 60 * 1000
const IST_OFFSET = 5.5 * 60 * 60 * 1000
// Most IDs one `in` query accepts
const IN_LIMIT = 30

const STAGES = ['new', 'contacted', 'talked', 'follow_up', 'do_not_contact'] as const
const TAGS = ['bug', 'feature_idea', 'pricing', 'confusing'] as const
const OUTCOMES = ['reached', 'no_answer', 'call_back'] as const

const date = z
  .instanceof(Timestamp)
  .transform((value) => value.toDate())
  .nullable()
  .catch(null)

const contactSchema = z.object({
  stage: z.enum(STAGES).catch('new'),
  ownerEmail: z.string().nullable().catch(null),
  // Drops tags this version doesn't know
  tags: z
    .array(z.unknown())
    .transform((tags) => tags.filter((tag) => TAGS.includes(tag as never)) as (typeof TAGS)[number][])
    .catch([]),
  nextFollowUpAt: date,
  lastContactedAt: date,
})

const noteSchema = z.object({
  authorEmail: z.string(),
  createdAt: z.instanceof(Timestamp).transform((value) => value.toDate()),
  outcome: z.enum(OUTCOMES),
  text: z.string(),
})

const STAGE_AFTER: Record<NoteOutcome, CrmStage> = {
  reached: 'talked',
  no_answer: 'contacted',
  call_back: 'follow_up',
}

const contactRef = (userId: string) => doc(db, 'crm_contacts', userId)
const notesRef = (userId: string) => collection(db, 'crm_contacts', userId, 'notes')

// Splits IDs into groups small enough for one `in` query
function chunks(ids: string[]) {
  return Array.from({ length: Math.ceil(ids.length / IN_LIMIT) }, (_, i) => ids.slice(i * IN_LIMIT, (i + 1) * IN_LIMIT))
}

async function getByIds(name: string, ids: string[]) {
  const snapshots = await Promise.all(
    chunks(ids).map((group) => getDocs(query(collection(db, name), where(documentId(), 'in', group)))),
  )
  return Object.fromEntries(snapshots.flatMap((snapshot) => snapshot.docs.map((d) => [d.id, d.data()])))
}

// Dates become Timestamps. null clears a field.
function toFields(change: CrmContactChange) {
  return Object.fromEntries(
    Object.entries(change).map(([key, value]) => [key, value instanceof Date ? Timestamp.fromDate(value) : value]),
  )
}

export const firebaseCrmRepo: CrmRepo = {
  async getContact(userId) {
    return contactSchema.parse((await getDoc(contactRef(userId))).data() ?? {})
  },

  async getStages(userIds) {
    const contacts = await getByIds('crm_contacts', userIds)
    return Object.fromEntries(Object.entries(contacts).map(([id, data]) => [id, contactSchema.parse(data).stage]))
  },

  async getDoNotContactIds() {
    const snapshot = await getDocs(query(collection(db, 'crm_contacts'), where('stage', '==', 'do_not_contact')))
    return snapshot.docs.map((d) => d.id)
  },

  async getFollowUpsDue(ownerEmail) {
    // Follow-ups are stored as midnight IST, so everything before tomorrow's midnight IST is due
    const tomorrow = (Math.floor((Date.now() + IST_OFFSET) / DAY) + 1) * DAY - IST_OFFSET
    const contacts = await getDocs(
      query(
        collection(db, 'crm_contacts'),
        where('ownerEmail', '==', ownerEmail),
        where('nextFollowUpAt', '<', Timestamp.fromMillis(tomorrow)),
        orderBy('nextFollowUpAt'),
      ),
    )
    const ids = contacts.docs.map((d) => d.id)
    if (!ids.length) return []

    // Subscription doc IDs are user IDs
    const [users, subscriptions] = await Promise.all([getByIds('users', ids), getByIds('subscriptions', ids)])
    // Deleted users have no users doc any more
    return ids.filter((id) => users[id]).map((id): User => toUser(id, users[id], subscriptions[id]))
  },

  async updateContact(userId, change, by) {
    await setDoc(contactRef(userId), { ...toFields(change), updatedAt: serverTimestamp(), updatedBy: by }, { merge: true })
  },

  async getNotes(userId) {
    const snapshot = await getDocs(query(notesRef(userId), orderBy('createdAt', 'desc')))
    return snapshot.docs.flatMap((d) => {
      const note = noteSchema.safeParse(d.data())
      return note.success ? [{ id: d.id, ...note.data }] : []
    })
  },

  async logContact(userId, { outcome, text, nextFollowUpAt }, by) {
    const batch = writeBatch(db)
    batch.set(doc(notesRef(userId)), { outcome, text, authorEmail: by, createdAt: serverTimestamp() })
    batch.set(
      contactRef(userId),
      {
        ...toFields({ stage: STAGE_AFTER[outcome], nextFollowUpAt }),
        lastContactedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: by,
      },
      { merge: true },
    )
    await batch.commit()
  },

  async updateNote(userId, noteId, note) {
    await updateDoc(doc(notesRef(userId), noteId), note)
  },

  async deleteNote(userId, noteId) {
    await deleteDoc(doc(notesRef(userId), noteId))
  },

  async getHqMembers() {
    const snapshot = await getDocs(collection(db, 'hq_users'))
    return snapshot.docs.flatMap((d) => {
      const role = z.enum(['admin', 'support', 'sales']).safeParse(d.get('role'))
      return role.success ? [{ email: d.id, role: role.data }] : []
    })
  },
}

import {
  collection,
  doc,
  documentId,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  Timestamp,
  where,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { z } from 'zod'
import type { UsersRepo } from '../users'
import { db, functions } from './app'

const PAGE_SIZE = 25

const userSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  phoneNumber: z.string().optional(),
  createdAt: z.string().optional(),
})

const subscriptionSchema = z.object({
  status: z.enum(['trial', 'active', 'expired']).optional(),
  trialEndDate: z.instanceof(Timestamp).optional(),
  subscriptionEndDate: z.instanceof(Timestamp).optional(),
})

// The app only sets status 'expired' when the user opens it, so the end date decides expiry.
// Expired subscriptions count as paid if they ever had a paid end date.
function toSubscription(data: unknown) {
  const subscription = subscriptionSchema.catch({}).parse(data)
  const paidEnd = subscription.status !== 'trial' && subscription.subscriptionEndDate
  const endsAt = paidEnd || subscription.trialEndDate
  if (!endsAt) return null
  return { plan: paidEnd ? ('paid' as const) : ('trial' as const), endsAt: endsAt.toDate() }
}

export const firebaseUsersRepo: UsersRepo = {
  // The cursor is the last user's doc ID. Fetches one extra user to know if there's a next page.
  async getUsers(cursor) {
    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE + 1))
    const snapshot = await getDocs(
      cursor ? query(usersQuery, startAfter(await getDoc(doc(db, 'users', cursor)))) : usersQuery,
    )
    const userDocs = snapshot.docs.slice(0, PAGE_SIZE)

    // Subscription doc IDs are user IDs. One `in` query covers the page (Firestore allows up to 30).
    const subscriptions = userDocs.length
      ? await getDocs(
          query(
            collection(db, 'subscriptions'),
            where(
              documentId(),
              'in',
              userDocs.map((userDoc) => userDoc.id),
            ),
          ),
        )
      : null

    return {
      users: userDocs.map((userDoc) => {
        const user = userSchema.catch({}).parse(userDoc.data())
        return {
          id: userDoc.id,
          name: user.name || 'Unnamed user',
          email: user.email ?? '',
          phone: user.phoneNumber || null,
          createdAt: user.createdAt ? new Date(user.createdAt) : null,
          subscription: toSubscription(subscriptions?.docs.find((s) => s.id === userDoc.id)?.data()),
        }
      }),
      nextCursor: snapshot.docs.length > PAGE_SIZE ? snapshot.docs[PAGE_SIZE - 1].id : null,
    }
  },

  // Same ordering as getUsers, so docs without createdAt are left out of the count too
  async countListedUsers() {
    return (await getCountFromServer(query(collection(db, 'users'), orderBy('createdAt')))).data().count
  },

  // Runs in a Cloud Function because the client can't delete other Auth accounts
  async deleteUser(id) {
    await httpsCallable(functions, 'hqDeleteUser')({ userId: id })
  },
}

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
  where,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { z } from 'zod'
import type { UsersRepo } from '../users'
import { getUserActivity, getUserActivitySummary } from './activityFirebase'
import { db, functions } from './app'
import { toSubscription } from './subscription'

const PAGE_SIZE = 25

const userSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  phoneNumber: z.string().optional(),
  createdAt: z.string().optional(),
})

// Labels saved by older app versions
const LEGACY_PROFESSIONS: Record<string, string> = { Electricians: 'Electrician', Civil: 'Civil contractor' }

const detailSchema = userSchema.extend({
  profession: z.string().optional(),
  // What the user typed after picking "Other"
  otherProfession: z.string().optional(),
  // Missing for users who signed up before the tour existed
  onboardingTour: z.enum(['project', 'expense', 'income', 'review', 'done', 'skipped']).optional().catch(undefined),
})

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

  async getUserDetail(id) {
    const [userDoc, subscription] = await Promise.all([
      getDoc(doc(db, 'users', id)),
      getDoc(doc(db, 'subscriptions', id)),
    ])
    if (!userDoc.exists()) return null

    const user = detailSchema.catch({}).parse(userDoc.data())
    const profession = user.profession && (LEGACY_PROFESSIONS[user.profession] ?? user.profession)
    return {
      id,
      name: user.name || 'Unnamed user',
      email: user.email ?? '',
      phone: user.phoneNumber || null,
      profession: (profession === 'Other' && user.otherProfession) || profession || null,
      createdAt: user.createdAt ? new Date(user.createdAt) : null,
      subscription: toSubscription(subscription.data()),
      tourStep: user.onboardingTour ?? null,
      // Same check the app uses to stop asking for profile details
      profileComplete: Boolean(user.name?.trim() && user.phoneNumber && user.profession),
    }
  },

  getUserActivitySummary,
  getUserActivity,
}

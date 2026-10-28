import { collection, doc, getDoc, getDocs, limit, orderBy, query, startAfter } from 'firebase/firestore'
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

export const firebaseUsersRepo: UsersRepo = {
  // The cursor is the last user's doc ID. Fetches one extra user to know if there's a next page.
  async getUsers(cursor) {
    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE + 1))
    const snapshot = await getDocs(
      cursor ? query(usersQuery, startAfter(await getDoc(doc(db, 'users', cursor)))) : usersQuery,
    )

    return {
      users: snapshot.docs.slice(0, PAGE_SIZE).map((userDoc) => {
        const user = userSchema.catch({}).parse(userDoc.data())
        return {
          id: userDoc.id,
          name: user.name || 'Unnamed user',
          email: user.email ?? '',
          phone: user.phoneNumber || null,
          createdAt: user.createdAt ? new Date(user.createdAt) : null,
        }
      }),
      nextCursor: snapshot.docs.length > PAGE_SIZE ? snapshot.docs[PAGE_SIZE - 1].id : null,
    }
  },

  // Runs in a Cloud Function because the client can't delete other Auth accounts
  async deleteUser(id) {
    await httpsCallable(functions, 'hqDeleteUser')({ userId: id })
  },
}

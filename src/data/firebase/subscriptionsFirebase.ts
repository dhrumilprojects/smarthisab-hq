import { collection, doc, getDoc, getDocs, orderBy, query, Timestamp, where } from 'firebase/firestore'
import { z } from 'zod'
import type { SubscriptionsRepo } from '../subscriptions'
import { db } from './app'

const userSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  phoneNumber: z.string().optional(),
})

export const firebaseSubscriptionsRepo: SubscriptionsRepo = {
  async getTrialsEnding(days) {
    const subscriptions = await getDocs(
      query(
        collection(db, 'subscriptions'),
        where('status', '==', 'trial'),
        where('trialEndDate', '>', Timestamp.now()),
        where('trialEndDate', '<=', Timestamp.fromMillis(Date.now() + days * 24 * 60 * 60 * 1000)),
        orderBy('trialEndDate'),
      ),
    )

    // Subscription doc IDs are user IDs
    return Promise.all(
      subscriptions.docs.map(async (subscription) => {
        const user = userSchema.catch({}).parse((await getDoc(doc(db, 'users', subscription.id))).data())
        return {
          id: subscription.id,
          name: user.name || 'Unnamed user',
          email: user.email ?? '',
          phone: user.phoneNumber || null,
          trialEndsAt: (subscription.get('trialEndDate') as Timestamp).toDate(),
        }
      }),
    )
  },
}

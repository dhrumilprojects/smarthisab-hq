import { collection, getCountFromServer, query, Timestamp, where, type Query } from 'firebase/firestore'
import type { StatsRepo } from '../stats'
import { db } from './app'

// The mobile app stores users.createdAt as an ISO string, so date filters compare ISO strings
async function count(q: Query) {
  return (await getCountFromServer(q)).data().count
}

export const firebaseStatsRepo: StatsRepo = {
  getTotalUsers() {
    return count(collection(db, 'users'))
  },

  getNewUsersSince(date) {
    return count(query(collection(db, 'users'), where('createdAt', '>=', date.toISOString())))
  },

  // Nothing marks subscriptions as expired, so the end date decides
  getUsersOnTrial() {
    return count(
      query(
        collection(db, 'subscriptions'),
        where('status', '==', 'trial'),
        where('trialEndDate', '>', Timestamp.now()),
      ),
    )
  },

  getPaidSubscribers() {
    return count(
      query(
        collection(db, 'subscriptions'),
        where('status', '==', 'active'),
        where('subscriptionEndDate', '>', Timestamp.now()),
      ),
    )
  },

  // One count query per day keeps the cost flat no matter how many people sign up
  getSignupsPerDay(days) {
    const today = new Date()
    return Promise.all(
      Array.from({ length: days }, async (_, i) => {
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1) + i)
        const nextDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
        return {
          date,
          count: await count(
            query(
              collection(db, 'users'),
              where('createdAt', '>=', date.toISOString()),
              where('createdAt', '<', nextDay.toISOString()),
            ),
          ),
        }
      }),
    )
  },
}

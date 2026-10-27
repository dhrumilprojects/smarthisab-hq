import { firebaseStatsRepo } from './firebase/statsFirebase'
import { firebaseSubscriptionsRepo } from './firebase/subscriptionsFirebase'
import type { StatsRepo } from './stats'
import type { SubscriptionsRepo } from './subscriptions'

export const statsRepo: StatsRepo = firebaseStatsRepo
export const subscriptionsRepo: SubscriptionsRepo = firebaseSubscriptionsRepo

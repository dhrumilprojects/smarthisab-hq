import { firebaseStatsRepo } from './firebase/statsFirebase'
import { firebaseSubscriptionsRepo } from './firebase/subscriptionsFirebase'
import { firebaseUsersRepo } from './firebase/usersFirebase'
import type { StatsRepo } from './stats'
import type { SubscriptionsRepo } from './subscriptions'
import type { UsersRepo } from './users'

export const statsRepo: StatsRepo = firebaseStatsRepo
export const subscriptionsRepo: SubscriptionsRepo = firebaseSubscriptionsRepo
export const usersRepo: UsersRepo = firebaseUsersRepo

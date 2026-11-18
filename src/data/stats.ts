import type { ActiveDayBuckets, DailyCount } from './types'

export type StatsRepo = {
  getTotalUsers(): Promise<number>
  getNewUsersSince(date: Date): Promise<number>
  // Only counts trials and paid plans whose end date is still ahead
  getUsersOnTrial(): Promise<number>
  getPaidSubscribers(): Promise<number>
  // Active is 3+ days, as on the Users page. HQ staff are not counted.
  getActiveDayBuckets(): Promise<ActiveDayBuckets>
  // One entry per day, oldest first, ending today
  getSignupsPerDay(days: number): Promise<DailyCount[]>
}

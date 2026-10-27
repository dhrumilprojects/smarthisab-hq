import type { TrialEndingUser } from './types'

export type SubscriptionsRepo = {
  // Users whose free trial ends within the next `days` days, soonest first
  getTrialsEnding(days: number): Promise<TrialEndingUser[]>
}

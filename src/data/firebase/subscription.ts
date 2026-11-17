import { Timestamp } from 'firebase/firestore'
import { z } from 'zod'

const subscriptionSchema = z.object({
  status: z.enum(['trial', 'active', 'expired']).optional(),
  trialEndDate: z.instanceof(Timestamp).optional(),
  subscriptionEndDate: z.instanceof(Timestamp).optional(),
})

// The app only sets status 'expired' when the user opens it, so the end date decides expiry.
// Expired subscriptions count as paid if they ever had a paid end date.
export function toSubscription(data: unknown) {
  const subscription = subscriptionSchema.catch({}).parse(data)
  const paidEnd = subscription.status !== 'trial' && subscription.subscriptionEndDate
  const endsAt = paidEnd || subscription.trialEndDate
  if (!endsAt) return null
  return { plan: paidEnd ? ('paid' as const) : ('trial' as const), endsAt: endsAt.toDate() }
}

import { z } from 'zod'
import type { User } from '../types'
import { toSubscription } from './subscription'

export const userSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  phoneNumber: z.string().optional(),
  createdAt: z.string().optional(),
})

// A `users` doc plus its `subscriptions` doc (same ID) as the User the table shows
export function toUser(id: string, data: unknown, subscriptionData: unknown): User {
  const user = userSchema.catch({}).parse(data)
  return {
    id,
    name: user.name || 'Unnamed user',
    email: user.email ?? '',
    phone: user.phoneNumber || null,
    createdAt: user.createdAt ? new Date(user.createdAt) : null,
    subscription: toSubscription(subscriptionData),
  }
}

export type DailyCount = {
  date: Date
  count: number
}

export type TrialEndingUser = {
  id: string
  name: string
  email: string
  phone: string | null
  trialEndsAt: Date
}

export type User = {
  id: string
  name: string
  email: string
  phone: string | null
  createdAt: Date | null
  // null when the user has no subscription doc. Expired when endsAt is in the past.
  subscription: { plan: 'trial' | 'paid'; endsAt: Date } | null
}

export type UsersPage = {
  users: User[]
  // Pass back to get the next page. Null when there are no more users.
  nextCursor: string | null
}

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

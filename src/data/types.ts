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

// active: logged expenses on 3+ different days (IST) in the last 14
// inactive: has logged expenses, but none in the last 7 days
// not_activated: has never logged an expense
// trial_ending: free trial ends within 7 days
export type UserSegment = 'active' | 'two_days' | 'one_day' | 'inactive' | 'not_activated' | 'trial_ending'

// Users by active days (IST) in the last 14. Each user is in one count.
export type ActiveDayBuckets = { active: number; twoDays: number; oneDay: number }

// Users in each segment, in the order the list shows them
export type UserSegments = Record<UserSegment, User[]>

export type ProfileField = 'name' | 'phone' | 'profession'

export type TourStep = 'project' | 'expense' | 'income' | 'review' | 'done' | 'skipped'

export type UserDetail = {
  id: string
  name: string
  email: string
  phone: string | null
  // "Other" is replaced by what the user typed, when they typed something
  profession: string | null
  createdAt: Date | null
  subscription: User['subscription']
  // null for users who signed up before the onboarding tour existed
  tourStep: TourStep | null
  // Profile fields the user hasn't filled in yet. Empty when the profile is complete.
  missingProfile: ProfileField[]
}

export type ActivityKind = 'project' | 'expense' | 'income' | 'vendor' | 'labour' | 'plan'

// Leave out `type` for everything
export type ActivityFilter = { type?: 'projects' | 'expenses' | 'income' | 'people' | 'plan' }

// One record the user added, or one plan event. Never holds amounts (except plan payments) or people's names.
export type ActivityEntry = {
  id: string
  kind: ActivityKind
  // When it was entered (server time)
  at: Date
  // "Added an expense", "Plan renewed", "Checkout started, not paid"…
  label: string
  // Expense category or vendor/labour trade, e.g. "Material"
  category: string | null
  projectName: string | null
  // The day an expense happened, only when it's a different day from `at`
  forDate: Date | null
  // Plan payments only, in rupees
  amount: number | null
}

export type ActivityPage = {
  entries: ActivityEntry[]
  nextCursor: string | null
}

// What the Activity page filters by. Test and internal accounts are hidden unless `showInternal` is true.
export type ActivityFeedFilter = ActivityFilter & { showInternal?: boolean }

// A line in the all-users feed: the entry plus who did it
export type FeedEntry = ActivityEntry & { userId: string; userName: string }

export type FeedPage = {
  entries: FeedEntry[]
  // Pass to getActivityBefore for older entries. null when there are none.
  nextBefore: Date | null
}

export type ActivityCounts = { records: number; activeDays: number }

export type ActivitySummary = {
  totals: { projects: number; expenses: number; income: number; vendors: number; labours: number }
  last7Days: ActivityCounts
  last30Days: ActivityCounts
  // IST hour (0–23) that starts the 2-hour window with the most entries in the last 30 days.
  // null when there are fewer than 10 entries.
  usualHour: number | null
  // null until the app records it (SMA-34)
  lastActiveAt: Date | null
}

export type CrmStage = 'new' | 'contacted' | 'talked' | 'follow_up' | 'do_not_contact'

export type CrmTag = 'bug' | 'feature_idea' | 'pricing' | 'confusing'

// What sales tracks about one app user. Users nobody has touched get the defaults (stage New).
export type CrmContact = {
  stage: CrmStage
  // HQ team member's email
  ownerEmail: string | null
  tags: CrmTag[]
  // Midnight IST of the follow-up day
  nextFollowUpAt: Date | null
  // Set when a note is added
  lastContactedAt: Date | null
}

// Only the fields being changed
export type CrmContactChange = Partial<Pick<CrmContact, 'stage' | 'ownerEmail' | 'tags' | 'nextFollowUpAt'>>

export type NoteOutcome = 'reached' | 'no_answer' | 'call_back'

export type CrmNote = {
  id: string
  authorEmail: string
  createdAt: Date
  outcome: NoteOutcome
  text: string
}

export type NoteInput = Pick<CrmNote, 'outcome' | 'text'>

// A call or message, saved as a note. Replaces the follow-up date (null clears it).
export type ContactLog = NoteInput & { nextFollowUpAt: Date | null }

export type HqMember = { email: string; role: 'admin' | 'support' | 'sales' }

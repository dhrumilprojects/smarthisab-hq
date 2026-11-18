import type { UserSegment } from '../../data/types'

// What the Users page can be filtered to. My follow-ups comes from the CRM, the rest from the segments.
export type UserFilter = 'my_follow_ups' | UserSegment

// Counted the same as on the Dashboard, so "Do not contact" users are not hidden from these
export const ACTIVE_DAY_SEGMENTS: UserSegment[] = ['active', 'two_days', 'one_day']

// Filter chips on the Users page, in display order
export const FILTERS: { id: UserFilter; label: string; hint: string; empty: string }[] = [
  {
    id: 'my_follow_ups',
    label: 'My follow-ups',
    hint: 'Users you own whose follow-up date is today or earlier, oldest first.',
    empty: 'No follow-ups due. Set a follow-up date in a user’s panel.',
  },
  {
    id: 'active',
    label: 'Active (3+ days)',
    hint: 'Logged expenses on 3 or more different days in the last 14. Same count as the Dashboard.',
    empty: 'No active users right now.',
  },
  {
    id: 'two_days',
    label: '2 days',
    hint: 'Logged expenses on exactly 2 different days in the last 14. Same count as the Dashboard.',
    empty: 'No users active on exactly 2 days.',
  },
  {
    id: 'one_day',
    label: '1 day',
    hint: 'Logged expenses on exactly 1 day in the last 14. Same count as the Dashboard.',
    empty: 'No users active on exactly 1 day.',
  },
  {
    id: 'inactive',
    label: 'Inactive 7+ days',
    hint: 'Have logged expenses before, but none in the last 7 days. Most recently active first.',
    empty: 'No inactive users.',
  },
  {
    id: 'not_activated',
    label: 'Not activated',
    hint: 'Have never logged an expense. Newest sign-ups first.',
    empty: 'Everyone has logged at least one expense.',
  },
  {
    id: 'trial_ending',
    label: 'Trial ends in 7 days',
    hint: 'Free trials ending in the next 7 days, soonest first.',
    empty: 'No trials ending this week.',
  },
]

import type { UserSegment } from '../../data/types'

// Filter chips on the Users page, in display order
export const SEGMENTS: { id: UserSegment; label: string; hint: string; empty: string }[] = [
  {
    id: 'active',
    label: 'Active',
    hint: 'Logged expenses on 3 or more different days in the last 14.',
    empty: 'No active users right now.',
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

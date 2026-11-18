import type { TourStep } from '../../data/types'

// The app's onboarding tour. `action` is what the user still has to do on that step.
export const TOUR_STEPS: Record<TourStep, { label: string; action: string | null }> = {
  project: { label: 'Step 1 of 4: create a project', action: 'create a project' },
  expense: { label: 'Step 2 of 4: add an expense', action: 'add an expense' },
  income: { label: 'Step 3 of 4: add a client payment', action: 'add a client payment' },
  review: { label: 'Step 4 of 4: see the totals', action: 'see the totals' },
  done: { label: 'Done', action: null },
  skipped: { label: 'Skipped', action: null },
}

import { useState, type ReactNode } from 'react'
import type { TourStep, UserDetail } from '../../data/types'
import { daysLeft, formatDate } from './istFormat'

const TOUR_STEPS: Record<TourStep, string> = {
  project: 'Step 1 of 4: create a project',
  expense: 'Step 2 of 4: add an expense',
  income: 'Step 3 of 4: add a client payment',
  review: 'Step 4 of 4: see the totals',
  done: 'Done',
  skipped: 'Skipped',
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-3">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="col-span-2 text-sm break-words text-gray-900">{children}</dd>
    </div>
  )
}

export default function UserDetailsTab({ user }: { user: UserDetail }) {
  const [now] = useState(Date.now)
  const plan = user.subscription
  const days = plan ? daysLeft(plan.endsAt, now) : 0

  return (
    <dl className="divide-y divide-gray-100">
      <Row label="Name">{user.name}</Row>
      <Row label="Email">{user.email || '—'}</Row>
      <Row label="Phone">{user.phone ?? '—'}</Row>
      <Row label="Profession">{user.profession ?? '—'}</Row>
      <Row label="Joined">{user.createdAt ? formatDate(user.createdAt) : '—'}</Row>
      <Row label="Plan">
        {plan ? (
          <>
            {plan.plan === 'paid' ? 'Paid' : 'Trial'} · {days > 0 ? 'ends' : 'ended'} {formatDate(plan.endsAt)}
            {days > 0 && <span className="text-gray-500"> · {days === 1 ? '1 day left' : `${days} days left`}</span>}
          </>
        ) : (
          'No subscription'
        )}
      </Row>
      <Row label="Onboarding tour">{user.tourStep ? TOUR_STEPS[user.tourStep] : 'Before tour'}</Row>
      <Row label="Profile">{user.profileComplete ? 'Complete' : 'Incomplete (missing name, phone or profession)'}</Row>
    </dl>
  )
}

import { useState, type ReactNode } from 'react'
import type { UserDetail } from '../../data/types'
import { daysLeft, formatDate } from './istFormat'
import { TOUR_STEPS } from './tourSteps'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-3">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="col-span-2 text-sm break-words text-gray-900">{children}</dd>
    </div>
  )
}

// ['phone', 'profession'] → "phone and profession"
function joinWithAnd(items: string[]) {
  return items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : items[0]
}

export default function UserDetailsTab({ user }: { user: UserDetail }) {
  const [now] = useState(Date.now)
  const plan = user.subscription
  const days = plan ? daysLeft(plan.endsAt, now) : 0

  return (
    <dl className="divide-y divide-gray-100">
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
      <Row label="Onboarding tour">{user.tourStep ? TOUR_STEPS[user.tourStep].label : 'Before tour'}</Row>
      <Row label="Profile">
        {user.missingProfile.length ? `Missing ${joinWithAnd(user.missingProfile)}` : 'Complete'}
      </Row>
    </dl>
  )
}

import { useState } from 'react'
import Avatar from '../../components/ui/Avatar'
import Card from '../../components/ui/Card'
import LoadState from '../../components/ui/LoadState'
import type { TrialEndingUser } from '../../data/types'

type Props = {
  // undefined while loading
  users: TrialEndingUser[] | undefined
  error: boolean
}

export default function TrialsEndingList({ users, error }: Props) {
  const [now] = useState(Date.now)

  return (
    <Card>
      <div className="border-b border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900">Trials ending soon</h2>
        <p className="text-sm text-gray-500">Free trials ending in the next 7 days. Reach out to convert them.</p>
      </div>

      <LoadState
        data={users}
        error={error}
        errorMessage="Couldn't load trials"
        emptyMessage="No trials ending this week."
      >
        {(users) => (
          <ul className="max-h-96 divide-y divide-gray-100 overflow-y-auto">
            {users.map((user) => {
              const daysLeft = Math.ceil((user.trialEndsAt.getTime() - now) / (24 * 60 * 60 * 1000))
              return (
                <li key={user.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={user.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="truncate text-xs text-gray-500">{user.phone ?? user.email}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      daysLeft <= 2 ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {daysLeft === 1 ? '1 day left' : `${daysLeft} days left`}
                  </span>
                  {user.phone && (
                    <a
                      href={`tel:${user.phone}`}
                      title={`Call ${user.name}`}
                      className="shrink-0 rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </a>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </LoadState>
    </Card>
  )
}

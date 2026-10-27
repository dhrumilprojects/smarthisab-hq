import { useState } from 'react'
import type { TrialEndingUser } from '../data/types'

type Props = {
  users: TrialEndingUser[] | undefined
  loading: boolean
  error: boolean
}

export default function TrialsEndingList({ users, loading, error }: Props) {
  const [now] = useState(Date.now)

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-xs">
      <div className="border-b border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900">Trials ending soon</h2>
        <p className="text-sm text-gray-500">Free trials ending in the next 7 days. Reach out to convert them.</p>
      </div>

      {loading ? (
        <div className="space-y-3 p-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : error || !users ? (
        <p className="p-5 text-sm text-red-600">Couldn't load trials</p>
      ) : users.length === 0 ? (
        <p className="p-5 text-sm text-gray-500">No trials ending this week.</p>
      ) : (
        <ul className="max-h-96 divide-y divide-gray-100 overflow-y-auto">
          {users.map((user) => {
            const daysLeft = Math.ceil((user.trialEndsAt.getTime() - now) / (24 * 60 * 60 * 1000))
            return (
              <li key={user.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-800">
                  {user.name[0].toUpperCase()}
                </div>
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
    </div>
  )
}

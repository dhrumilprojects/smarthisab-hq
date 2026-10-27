import { useState } from 'react'
import { useAuth } from '../auth/auth'
import SignupsChart from '../components/SignupsChart'
import StatCard from '../components/StatCard'
import TrialsEndingList from '../components/TrialsEndingList'
import {
  useNewUsersThisMonth,
  usePaidSubscribers,
  useSignupsPerDay,
  useTotalUsers,
  useTrialsEnding,
  useUsersOnTrial,
} from '../hooks/useStats'

export default function DashboardPage() {
  const user = useAuth()
  const [hour] = useState(() => new Date().getHours())
  const totalUsers = useTotalUsers()
  const newUsers = useNewUsersThisMonth()
  const onTrial = useUsersOnTrial()
  const paid = usePaidSubscribers()
  const signups = useSignupsPerDay(30)
  const trialsEnding = useTrialsEnding(7)

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">
        Good {hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'}, {user?.name.split(' ')[0]}. Here's how
        Smart Hisaab is doing.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total users"
          value={totalUsers.data}
          loading={totalUsers.isPending}
          error={totalUsers.isError}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <StatCard
          label="New users this month"
          value={newUsers.data}
          loading={newUsers.isPending}
          error={newUsers.isError}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M19 8v6M22 11h-6" />
            </svg>
          }
        />
        <StatCard
          label="On free trial"
          value={onTrial.data}
          loading={onTrial.isPending}
          error={onTrial.isError}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          }
        />
        <StatCard
          label="Paid subscribers"
          value={paid.data}
          loading={paid.isPending}
          error={paid.isError}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M2 10h20" />
            </svg>
          }
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SignupsChart data={signups.data} loading={signups.isPending} error={signups.isError} />
        </div>
        <TrialsEndingList users={trialsEnding.data} loading={trialsEnding.isPending} error={trialsEnding.isError} />
      </div>
    </div>
  )
}

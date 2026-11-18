import { useState } from 'react'
import Avatar from '../../components/ui/Avatar'
import SidePanel from '../../components/ui/SidePanel'
import Tabs from '../../components/ui/Tabs'
import CrmFields from './CrmFields'
import SubscriptionBadge from './SubscriptionBadge'
import UserActivityTab from './UserActivityTab'
import UserDetailsTab from './UserDetailsTab'
import UserNotesTab from './UserNotesTab'
import { useUserDetail } from './useUsers'

type Tab = 'details' | 'activity' | 'notes'

const linkClass = 'rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50'

// wa.me needs the country code. The app saves 10-digit Indian numbers without it.
function whatsappLink(phone: string) {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`
}

export default function UserPanel({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('details')
  const [now] = useState(Date.now)
  const { data: user, isError } = useUserDetail(userId)

  return (
    <SidePanel label={user?.name ?? 'User'} onClose={onClose}>
      <div className="border-b border-gray-200 p-6 pr-14">
        {isError ? (
          <p className="text-sm text-red-600">Couldn't load this user</p>
        ) : user === undefined ? (
          <div className="h-12 w-64 animate-pulse rounded-lg bg-gray-100" />
        ) : user === null ? (
          <p className="text-sm text-gray-500">This user doesn't exist any more.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-4">
              <Avatar name={user.name} size="lg" />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-semibold text-gray-900">{user.name}</h2>
                <div className="mt-1">
                  <SubscriptionBadge subscription={user.subscription} now={now} />
                </div>
              </div>
              {user.phone && (
                <div className="flex gap-2">
                  <a href={`tel:${user.phone}`} className={linkClass}>
                    Call
                  </a>
                  <a href={whatsappLink(user.phone)} target="_blank" rel="noreferrer" className={linkClass}>
                    WhatsApp
                  </a>
                </div>
              )}
            </div>
            <div className="mt-5">
              <CrmFields userId={userId} />
            </div>
          </>
        )}
      </div>

      {user && (
        <div className="px-6">
          <Tabs
            tabs={[
              { id: 'details', label: 'Details' },
              { id: 'activity', label: 'Activity' },
              { id: 'notes', label: 'Notes' },
            ]}
            active={tab}
            onChange={setTab}
          />
          <div className="py-6">
            {tab === 'details' && <UserDetailsTab user={user} />}
            {tab === 'activity' && <UserActivityTab userId={userId} />}
            {tab === 'notes' && <UserNotesTab userId={userId} />}
          </div>
        </div>
      )}
    </SidePanel>
  )
}

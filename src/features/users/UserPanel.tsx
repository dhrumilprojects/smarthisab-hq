import { useState } from 'react'
import { useAuth } from '../../auth/auth'
import Avatar from '../../components/ui/Avatar'
import SidePanel from '../../components/ui/SidePanel'
import Tabs from '../../components/ui/Tabs'
import CopyReportMessageButton from './CopyReportMessageButton'
import CrmStatus from './CrmStatus'
import DownloadReportButton from './DownloadReportButton'
import SubscriptionBadge from './SubscriptionBadge'
import UserActivityTab from './UserActivityTab'
import UserDetailsTab from './UserDetailsTab'
import UserNotesTab from './UserNotesTab'
import { useNotes } from './useCrm'
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
  const notes = useNotes(userId)
  const hqUser = useAuth()
  const canDownload = hqUser?.role === 'admin' || hqUser?.role === 'sales'

  return (
    <SidePanel label={user?.name ?? 'User'} onClose={onClose}>
      <div className="border-b border-gray-200 p-5 pr-14">
        {isError ? (
          <p className="text-sm text-red-600">Couldn't load this user</p>
        ) : user === undefined ? (
          <div className="h-12 w-64 animate-pulse rounded-lg bg-gray-100" />
        ) : user === null ? (
          <p className="text-sm text-gray-500">This user doesn't exist any more.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Avatar name={user.name} />
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <h2 className="truncate text-lg font-semibold text-gray-900">{user.name}</h2>
                <SubscriptionBadge subscription={user.subscription} now={now} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {user.phone ? (
                  <>
                    <a href={`tel:${user.phone}`} className={linkClass}>
                      Call
                    </a>
                    <a href={whatsappLink(user.phone)} target="_blank" rel="noreferrer" className={linkClass}>
                      WhatsApp
                    </a>
                  </>
                ) : (
                  <span className="text-xs text-gray-500">No phone number</span>
                )}
                {!user.phone && user.email && (
                  <a href={`mailto:${user.email}`} className={linkClass}>
                    Email
                  </a>
                )}
                {canDownload && (
                  <>
                    <DownloadReportButton user={user} />
                    <CopyReportMessageButton userId={user.id} />
                  </>
                )}
              </div>
            </div>
            <div className="mt-3">
              <CrmStatus user={user} />
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
              { id: 'notes', label: notes.data?.length ? `Notes (${notes.data.length})` : 'Notes' },
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

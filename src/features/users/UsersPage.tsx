import { useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '../../auth/auth'
import Card from '../../components/ui/Card'
import LoadState from '../../components/ui/LoadState'
import PageHeader from '../../components/ui/PageHeader'
import Pagination from '../../components/ui/Pagination'
import type { User } from '../../data/types'
import { useTotalUsers } from '../dashboard/useStats'
import { formatTime } from './istFormat'
import SegmentChips from './SegmentChips'
import { FILTERS, type UserFilter } from './segments'
import { useFollowUpsDue, useStages } from './useCrm'
import { useDeleteUser, useListedUserCount, useUserSegments, useUsers } from './useUsers'
import UserPanel from './UserPanel'
import UsersTable from './UsersTable'

const PAGE_SIZE = 25

export default function UsersPage() {
  const hqUser = useAuth()
  const isAdmin = hqUser?.role === 'admin'
  // Cursor for each page visited so far. The first page has none.
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined])
  const { data, isError, isPlaceholderData } = useUsers(cursors[cursors.length - 1])
  const totalUsers = useTotalUsers()
  const listedUsers = useListedUserCount()
  const deleteUser = useDeleteUser()
  const page = cursors.length
  // A filter's users are all loaded at once, so its pages are cut in the browser
  const segments = useUserSegments()
  const followUps = useFollowUpsDue(hqUser?.email)
  // The Dashboard links here with /users?filter=<id>
  const [searchParams, setSearchParams] = useSearchParams()
  const [filter, setFilter] = useState<UserFilter | null>(
    () => FILTERS.find((f) => f.id === searchParams.get('filter'))?.id ?? null,
  )
  const [filterPage, setFilterPage] = useState(1)
  const filterInfo = FILTERS.find((f) => f.id === filter)
  const filterQuery = filter === 'my_follow_ups' ? followUps : segments
  const filterUsers = filter === 'my_follow_ups' ? followUps.data : filter ? segments.data?.[filter] : undefined
  const shownUsers = filter ? filterUsers?.slice((filterPage - 1) * PAGE_SIZE, filterPage * PAGE_SIZE) : data?.users
  const stages = useStages(shownUsers?.map((user) => user.id) ?? [])
  // The open user's panel lives in the URL (/users?user=<id>), so links open it and Back closes it
  const openUserId = searchParams.get('user')
  const location = useLocation()
  const navigate = useNavigate()
  // True when this page opened the panel, so going back lands on the list
  const openedHere = location.state?.panel === true

  function openUser(user: User) {
    // Swapping users replaces the history entry, so one Back still closes the panel
    setSearchParams({ user: user.id }, { replace: openUserId !== null, state: { panel: true } })
  }

  function closeUser() {
    if (openedHere) navigate(-1)
    else setSearchParams({}, { replace: true })
  }

  function changeFilter(next: UserFilter | null) {
    setFilter(next)
    setFilterPage(1)
  }

  function confirmDelete(user: User) {
    const confirmed = window.confirm(
      `Delete ${user.name} (${user.email || user.phone || user.id})?\n\n` +
        'This permanently deletes their account and all their data: projects, expenses, payments, ' +
        'vendors, labours, subscription and payment history. This cannot be undone.',
    )
    if (confirmed) deleteUser.mutate(user.id)
  }

  return (
    <>
      <PageHeader title="Users" description="Everyone who has signed up for Smart Hisaab, newest first." />

      {deleteUser.isError && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Couldn't delete user: {deleteUser.error.message}
        </p>
      )}

      <div className="mt-8">
        <SegmentChips
          active={filter}
          counts={{
            my_follow_ups: followUps.data?.length,
            ...(segments.data &&
              Object.fromEntries(Object.entries(segments.data).map(([id, users]) => [id, users.length]))),
          }}
          onChange={changeFilter}
        />
        {filterInfo && (
          <p className="mt-3 text-sm text-gray-500">
            {filterInfo.hint}
            {filter !== 'my_follow_ups' &&
              segments.data &&
              ` Updated ${formatTime(new Date(segments.dataUpdatedAt))}.`}
          </p>
        )}
      </div>

      <div className="mt-4">
        <Card>
          <LoadState
            data={shownUsers}
            error={filter ? filterQuery.isError : isError}
            errorMessage="Couldn't load users"
            emptyMessage={filterInfo?.empty ?? (page > 1 ? 'No more users.' : 'No users yet.')}
          >
            {(users) => (
              <UsersTable
                users={users}
                // A failed stage lookup shouldn't hide the list, so it falls back to New
                stages={stages.isError ? {} : stages.data}
                onOpen={openUser}
                selectedId={openUserId ?? undefined}
                onDelete={isAdmin ? confirmDelete : undefined}
                deletingId={deleteUser.isPending ? deleteUser.variables : undefined}
              />
            )}
          </LoadState>
        </Card>
      </div>

      {filterUsers && filterUsers.length > PAGE_SIZE && (
        <div className="mt-4">
          <Pagination
            page={filterPage}
            totalPages={Math.ceil(filterUsers.length / PAGE_SIZE)}
            hasNext={filterPage * PAGE_SIZE < filterUsers.length}
            loading={false}
            onPrev={() => setFilterPage(filterPage - 1)}
            onNext={() => setFilterPage(filterPage + 1)}
          />
        </div>
      )}

      {!filter && data && (page > 1 || data.nextCursor) && (
        <div className="mt-4">
          <Pagination
            page={page}
            totalPages={listedUsers.data === undefined ? undefined : Math.max(1, Math.ceil(listedUsers.data / PAGE_SIZE))}
            hasNext={data.nextCursor !== null}
            loading={isPlaceholderData}
            onPrev={() => setCursors(cursors.slice(0, -1))}
            onNext={() => data.nextCursor && setCursors([...cursors, data.nextCursor])}
          />
        </div>
      )}

      {!filter && totalUsers.data !== undefined && listedUsers.data !== undefined && totalUsers.data > listedUsers.data && (
        <p className="mt-4 text-sm text-amber-700">
          {totalUsers.data - listedUsers.data} of {totalUsers.data} users have no sign-up date, so they aren't listed
          here.
        </p>
      )}

      {openUserId && <UserPanel userId={openUserId} onClose={closeUser} />}
    </>
  )
}

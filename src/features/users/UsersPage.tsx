import { useState } from 'react'
import { useAuth } from '../../auth/auth'
import Card from '../../components/ui/Card'
import LoadState from '../../components/ui/LoadState'
import PageHeader from '../../components/ui/PageHeader'
import Pagination from '../../components/ui/Pagination'
import type { User } from '../../data/types'
import { useTotalUsers } from '../dashboard/useStats'
import { useDeleteUser, useUsers } from './useUsers'
import UsersTable from './UsersTable'

const PAGE_SIZE = 25

export default function UsersPage() {
  const isAdmin = useAuth()?.role === 'admin'
  // Cursor for each page visited so far. The first page has none.
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined])
  const { data, isError, isPlaceholderData } = useUsers(cursors[cursors.length - 1])
  const totalUsers = useTotalUsers()
  const deleteUser = useDeleteUser()
  const page = cursors.length

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
        <Card>
          <LoadState
            data={data?.users}
            error={isError}
            errorMessage="Couldn't load users"
            emptyMessage={page > 1 ? 'No more users.' : 'No users yet.'}
          >
            {(users) => (
              <UsersTable
                users={users}
                onDelete={isAdmin ? confirmDelete : undefined}
                deletingId={deleteUser.isPending ? deleteUser.variables : undefined}
              />
            )}
          </LoadState>
        </Card>
      </div>

      {data && (page > 1 || data.nextCursor) && (
        <div className="mt-4">
          <Pagination
            page={page}
            totalPages={totalUsers.data === undefined ? undefined : Math.max(1, Math.ceil(totalUsers.data / PAGE_SIZE))}
            hasNext={data.nextCursor !== null}
            loading={isPlaceholderData}
            onPrev={() => setCursors(cursors.slice(0, -1))}
            onNext={() => data.nextCursor && setCursors([...cursors, data.nextCursor])}
          />
        </div>
      )}
    </>
  )
}

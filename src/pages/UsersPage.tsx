import { useState } from 'react'
import { useAuth } from '../auth/auth'
import type { User } from '../data/types'
import { useTotalUsers } from '../hooks/useStats'
import { useDeleteUser, useUsers } from '../hooks/useUsers'

const PAGE_SIZE = 25

export default function UsersPage() {
  const isAdmin = useAuth()?.role === 'admin'
  // Cursor for each page visited so far. The first page has none.
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined])
  const { data, isPending, isError, isPlaceholderData } = useUsers(cursors[cursors.length - 1])
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
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
      <p className="mt-1 text-sm text-gray-500">Everyone who has signed up for Smart Hisaab, newest first.</p>

      {deleteUser.isError && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Couldn't delete user: {deleteUser.error.message}
        </p>
      )}

      <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
        {isPending ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : isError ? (
          <p className="p-5 text-sm text-red-600">Couldn't load users</p>
        ) : data.users.length === 0 ? (
          <p className="p-5 text-sm text-gray-500">{page > 1 ? 'No more users.' : 'No users yet.'}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Joined</th>
                  {isAdmin && <th className="px-5 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-800">
                          {user.name[0].toUpperCase()}
                        </div>
                        <span className="font-medium whitespace-nowrap text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{user.email || '—'}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-gray-600">
                      {user.phone ? (
                        <a href={`tel:${user.phone}`} className="hover:text-brand-700 hover:underline">
                          {user.phone}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-gray-600">
                      {user.createdAt?.toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }) ?? '—'}
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => confirmDelete(user)}
                          disabled={deleteUser.isPending}
                          className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium whitespace-nowrap text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deleteUser.isPending && deleteUser.variables === user.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data && (page > 1 || data.nextCursor) && (
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            Page {page}
            {totalUsers.data !== undefined && ` of ${Math.max(1, Math.ceil(totalUsers.data / PAGE_SIZE))}`}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCursors(cursors.slice(0, -1))}
              disabled={page === 1 || isPlaceholderData}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => data.nextCursor && setCursors([...cursors, data.nextCursor])}
              disabled={!data.nextCursor || isPlaceholderData}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {isPlaceholderData ? 'Loading…' : 'Next'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

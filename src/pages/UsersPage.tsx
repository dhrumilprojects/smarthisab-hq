import { useUsers } from '../hooks/useUsers'

export default function UsersPage() {
  const { data, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useUsers()

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
      <p className="mt-1 text-sm text-gray-500">Everyone who has signed up for Smart Hisaab, newest first.</p>

      <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
        {isPending ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : isError ? (
          <p className="p-5 text-sm text-red-600">Couldn't load users</p>
        ) : data.pages[0].users.length === 0 ? (
          <p className="p-5 text-sm text-gray-500">No users yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.pages.flatMap((page) =>
                  page.users.map((user) => (
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
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {hasNextPage && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}

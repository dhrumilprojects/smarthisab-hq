import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import type { User } from '../../data/types'

type Props = {
  users: User[]
  // Leave out to hide the delete column
  onDelete?: (user: User) => void
  // User currently being deleted. Other delete buttons are disabled meanwhile.
  deletingId?: string
}

export default function UsersTable({ users, onDelete, deletingId }: Props) {
  return (
    <Table columns={['Name', 'Email', 'Phone', 'Joined', ...(onDelete ? [''] : [])]}>
      {users.map((user) => (
        <tr key={user.id} className="hover:bg-gray-50">
          <td className="px-5 py-3">
            <div className="flex items-center gap-3">
              <Avatar name={user.name} />
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
            {user.createdAt?.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) ?? '—'}
          </td>
          {onDelete && (
            <td className="px-5 py-3 text-right">
              <Button variant="danger" onClick={() => onDelete(user)} disabled={deletingId !== undefined}>
                {deletingId === user.id ? 'Deleting…' : 'Delete'}
              </Button>
            </td>
          )}
        </tr>
      ))}
    </Table>
  )
}

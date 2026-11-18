import { useState } from 'react'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import type { CrmStage, User } from '../../data/types'
import StageBadge from './StageBadge'
import SubscriptionBadge from './SubscriptionBadge'

type Props = {
  users: User[]
  // Users missing from it are stage New. undefined while loading.
  stages: Record<string, CrmStage> | undefined
  onOpen: (user: User) => void
  // User whose panel is open
  selectedId?: string
  // Leave out to hide the delete column
  onDelete?: (user: User) => void
  // User currently being deleted. Other delete buttons are disabled meanwhile.
  deletingId?: string
}

export default function UsersTable({ users, stages, onOpen, selectedId, onDelete, deletingId }: Props) {
  const [now] = useState(Date.now)

  return (
    <Table columns={['Name', 'Subscription', 'Stage', 'Email', 'Phone', 'Joined', ...(onDelete ? [''] : [])]}>
      {users.map((user) => (
        <tr
          key={user.id}
          // Clicking a row while the panel is open swaps it to this user instead of closing it
          data-panel-trigger
          // Links and buttons in the row do their own thing
          onClick={(event) => !(event.target as Element).closest('a, button') && onOpen(user)}
          className={`cursor-pointer ${user.id === selectedId ? 'bg-brand-50' : 'hover:bg-gray-50'}`}
        >
          <td className="px-5 py-3">
            <div className="flex items-center gap-3">
              <Avatar name={user.name} />
              <span title={user.name} className="max-w-40 truncate font-medium text-gray-900">
                {user.name}
              </span>
            </div>
          </td>
          <td className="px-5 py-3">
            <SubscriptionBadge subscription={user.subscription} now={now} />
          </td>
          <td className="px-5 py-3">
            {stages ? (
              <StageBadge stage={stages[user.id] ?? 'new'} />
            ) : (
              <div className="h-5 w-16 animate-pulse rounded-full bg-gray-100" />
            )}
          </td>
          <td className="px-5 py-3 text-gray-600">
            <span title={user.email} className="block max-w-64 truncate">
              {user.email || '—'}
            </span>
          </td>
          <td className="px-5 py-3 whitespace-nowrap text-gray-600">
            {user.phone ? (
              <a href={`tel:${user.phone}`} className="hover:text-brand-800 hover:underline">
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

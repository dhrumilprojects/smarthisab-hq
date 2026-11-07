import { useState } from 'react'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
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

function SubscriptionBadge({ subscription, now }: { subscription: User['subscription']; now: number }) {
  if (!subscription) return <Badge>No subscription</Badge>

  const plan = subscription.plan === 'paid' ? 'Paid' : 'Trial'
  const daysLeft = Math.ceil((subscription.endsAt.getTime() - now) / (24 * 60 * 60 * 1000))
  if (daysLeft <= 0) return <Badge tone="danger">{plan} expired</Badge>

  return (
    <Badge tone={daysLeft <= 7 ? 'warning' : subscription.plan === 'paid' ? 'success' : 'neutral'}>
      {plan} · {daysLeft === 1 ? '1 day left' : `${daysLeft} days left`}
    </Badge>
  )
}

export default function UsersTable({ users, onDelete, deletingId }: Props) {
  const [now] = useState(Date.now)

  return (
    <Table columns={['Name', 'Subscription', 'Email', 'Phone', 'Joined', ...(onDelete ? [''] : [])]}>
      {users.map((user) => (
        <tr key={user.id} className="hover:bg-gray-50">
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
          <td className="px-5 py-3 text-gray-600">
            <span title={user.email} className="block max-w-64 truncate">
              {user.email || '—'}
            </span>
          </td>
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

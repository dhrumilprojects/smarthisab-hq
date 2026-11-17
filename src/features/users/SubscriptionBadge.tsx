import Badge from '../../components/ui/Badge'
import type { User } from '../../data/types'
import { daysLeft } from './istFormat'

export default function SubscriptionBadge({ subscription, now }: { subscription: User['subscription']; now: number }) {
  if (!subscription) return <Badge>No subscription</Badge>

  const plan = subscription.plan === 'paid' ? 'Paid' : 'Trial'
  const days = daysLeft(subscription.endsAt, now)
  if (days <= 0) return <Badge tone="danger">{plan} expired</Badge>

  return (
    <Badge tone={days <= 7 ? 'warning' : subscription.plan === 'paid' ? 'success' : 'neutral'}>
      {plan} · {days === 1 ? '1 day left' : `${days} days left`}
    </Badge>
  )
}

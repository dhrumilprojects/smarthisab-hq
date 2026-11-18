import type { CrmContact, UserDetail, UserSegment } from '../../data/types'
import { dayKey, daysLeft, formatShortDate } from './istFormat'
import { TOUR_STEPS } from './tourSteps'

const DAY = 24 * 60 * 60 * 1000

export type NextStep = { text: string; tone: 'urgent' | 'normal' | 'quiet' }

type Input = {
  user: UserDetail
  contact: CrmContact
  // From the user's own activity summary, so it's right even for someone who signed up a minute ago
  expenseCount: number
  // The Users page filters this user is in (SMA-37), so the panel and the filter chips agree
  segments: UserSegment[]
  now: number
}

// What sales should do next with this user. The first rule that matches wins.
export function nextStep({ user, contact, expenseCount, segments, now }: Input): NextStep {
  // Checked first, so nothing ever suggests calling someone who asked not to be contacted
  if (contact.stage === 'do_not_contact') return { text: 'Do not contact.', tone: 'quiet' }

  const followUp = contact.nextFollowUpAt
  if (followUp && dayKey(followUp) <= dayKey(new Date(now))) {
    return {
      text: dayKey(followUp) === dayKey(new Date(now)) ? 'Follow-up due today.' : `Follow-up was due on ${formatShortDate(followUp)}.`,
      tone: 'urgent',
    }
  }

  const stuckAt = user.tourStep && TOUR_STEPS[user.tourStep].action
  if (stuckAt && user.createdAt && now - user.createdAt.getTime() >= 2 * DAY) {
    return { text: `Stuck at "${stuckAt}". Send a WhatsApp nudge.`, tone: 'normal' }
  }

  if (expenseCount === 0) return { text: "Hasn't logged an expense yet. Ask what's blocking them.", tone: 'normal' }

  const trialDays = user.subscription?.plan === 'trial' ? daysLeft(user.subscription.endsAt, now) : 0
  if (trialDays > 0 && trialDays <= 7) {
    return {
      text: `${trialDays === 1 ? 'Trial ends tomorrow' : `Trial ends in ${trialDays} days`}. Ask about subscribing.`,
      tone: 'normal',
    }
  }

  if (segments.includes('inactive')) {
    return { text: 'No expenses in the last 7 days. Check in on how it’s going.', tone: 'normal' }
  }
  if (segments.includes('active')) return { text: 'Active user. A good one to ask for feedback.', tone: 'normal' }

  return { text: 'Nothing to follow up on right now.', tone: 'quiet' }
}

import type { CrmStage, CrmTag, NoteOutcome } from '../../data/types'

export const STAGES: { id: CrmStage; label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' }[] = [
  { id: 'new', label: 'New', tone: 'neutral' },
  { id: 'contacted', label: 'Contacted', tone: 'neutral' },
  { id: 'talked', label: 'Talked', tone: 'success' },
  { id: 'follow_up', label: 'Follow up', tone: 'warning' },
  { id: 'do_not_contact', label: 'Do not contact', tone: 'danger' },
]

export const TAGS: { id: CrmTag; label: string }[] = [
  { id: 'bug', label: 'Bug' },
  { id: 'feature_idea', label: 'Feature idea' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'confusing', label: 'Confusing' },
]

export const OUTCOMES: { id: NoteOutcome; label: string }[] = [
  { id: 'reached', label: 'Reached' },
  { id: 'no_answer', label: 'No answer' },
  { id: 'call_back', label: 'Call back' },
]

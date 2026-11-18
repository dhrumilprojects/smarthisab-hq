import { useState } from 'react'
import Button from '../../components/ui/Button'
import Chip from '../../components/ui/Chip'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import type { NoteOutcome } from '../../data/types'
import { OUTCOMES } from './crmLabels'
import { dayKey, fromDayKey } from './istFormat'
import { useLogContact } from './useCrm'

type Props = {
  userId: string
  // Signed-in HQ user's email
  by: string
  // The user's current follow-up date. A future one is kept unless changed; a due one starts empty.
  currentFollowUp: Date | null
  onDone: () => void
}

export default function LogContactForm({ userId, by, currentFollowUp, onDone }: Props) {
  const logContact = useLogContact(userId, by)
  const [today] = useState(() => dayKey(new Date()))
  const [outcome, setOutcome] = useState<NoteOutcome>('reached')
  const [text, setText] = useState('')
  const [followUp, setFollowUp] = useState(currentFollowUp && dayKey(currentFollowUp) > today ? dayKey(currentFollowUp) : '')
  const needsDate = outcome === 'call_back' && !followUp

  return (
    <form
      className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4"
      onSubmit={(event) => {
        event.preventDefault()
        logContact.mutate(
          { outcome, text: text.trim(), nextFollowUpAt: followUp ? fromDayKey(followUp) : null },
          { onSuccess: onDone },
        )
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-900">How did it go?</span>
        {OUTCOMES.map((option) => (
          <Chip key={option.id} selected={outcome === option.id} onClick={() => setOutcome(option.id)}>
            {option.label}
          </Chip>
        ))}
      </div>
      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="What did they say? (optional)"
        aria-label="Note"
      />
      <label className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
        Follow up on
        <Input type="date" min={today} value={followUp} onChange={(event) => setFollowUp(event.target.value)} />
        <span className={`text-xs ${needsDate ? 'text-amber-700' : 'text-gray-500'}`}>
          {outcome === 'call_back' ? 'Needed for Call back' : 'Optional'}
        </span>
      </label>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" disabled={logContact.isPending || needsDate}>
          {logContact.isPending ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" onClick={onDone}>
          Cancel
        </Button>
      </div>
      {logContact.isError && <p className="text-sm text-red-600">Couldn't save: {logContact.error.message}</p>}
    </form>
  )
}

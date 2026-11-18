import { useState } from 'react'
import { useAuth } from '../../auth/auth'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Chip from '../../components/ui/Chip'
import LoadState from '../../components/ui/LoadState'
import Textarea from '../../components/ui/Textarea'
import type { CrmNote, NoteInput } from '../../data/types'
import { OUTCOMES } from './crmLabels'
import { formatDate, formatTime } from './istFormat'
import { useDeleteNote, useNotes, useUpdateNote } from './useCrm'

type FormProps = {
  initial: NoteInput
  saving: boolean
  saveLabel: string
  onSave: (note: NoteInput) => void
  onCancel?: () => void
}

// Outcome and text, for editing a note. New notes come from Log a contact in the panel header.
function NoteForm({ initial, saving, saveLabel, onSave, onCancel }: FormProps) {
  const [note, setNote] = useState(initial)

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        onSave({ ...note, text: note.text.trim() })
      }}
    >
      <div className="flex flex-wrap gap-2">
        {OUTCOMES.map((outcome) => (
          <Chip key={outcome.id} selected={note.outcome === outcome.id} onClick={() => setNote({ ...note, outcome: outcome.id })}>
            {outcome.label}
          </Chip>
        ))}
      </div>
      <Textarea
        value={note.text}
        onChange={(event) => setNote({ ...note, text: event.target.value })}
        placeholder="What happened on the call?"
        aria-label="Note"
      />
      <div className="flex gap-2">
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Saving…' : saveLabel}
        </Button>
        {onCancel && (
          <Button type="button" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}

function Note({ userId, note, isMine }: { userId: string; note: CrmNote; isMine: boolean }) {
  const [editing, setEditing] = useState(false)
  const updateNote = useUpdateNote(userId)
  const deleteNote = useDeleteNote(userId)
  const outcome = OUTCOMES.find((o) => o.id === note.outcome)!
  const error = updateNote.error ?? deleteNote.error

  return (
    <li className="space-y-2 py-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium text-gray-900">{note.authorEmail}</span>
        <span className="text-gray-500">
          {formatDate(note.createdAt)}, {formatTime(note.createdAt)}
        </span>
        <Badge tone={note.outcome === 'reached' ? 'success' : 'neutral'}>{outcome.label}</Badge>
        {isMine && !editing && (
          <span className="ml-auto flex gap-2">
            <Button onClick={() => setEditing(true)}>Edit</Button>
            <Button
              variant="danger"
              disabled={deleteNote.isPending}
              onClick={() => window.confirm('Delete this note?') && deleteNote.mutate(note.id)}
            >
              {deleteNote.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </span>
        )}
      </div>

      {editing ? (
        <NoteForm
          initial={{ outcome: note.outcome, text: note.text }}
          saving={updateNote.isPending}
          saveLabel="Save"
          onSave={(changed) => updateNote.mutate({ id: note.id, ...changed }, { onSuccess: () => setEditing(false) })}
          onCancel={() => setEditing(false)}
        />
      ) : (
        note.text && <p className="text-sm whitespace-pre-wrap text-gray-700">{note.text}</p>
      )}

      {error && <p className="text-sm text-red-600">Couldn't change the note: {error.message}</p>}
    </li>
  )
}

export default function UserNotesTab({ userId }: { userId: string }) {
  const hqUser = useAuth()
  const canEdit = hqUser?.role === 'admin' || hqUser?.role === 'sales'
  const { data: notes, isError } = useNotes(userId)

  return (
    <div className="space-y-4">
      <LoadState
        data={notes}
        error={isError}
        errorMessage="Couldn't load notes"
        emptyMessage={canEdit ? 'No notes yet. Use Log a contact at the top to add one.' : 'No notes yet.'}
      >
        {(notes) => (
          <ul className="divide-y divide-gray-100">
            {notes.map((note) => (
              <Note key={note.id} userId={userId} note={note} isMine={canEdit && note.authorEmail === hqUser?.email} />
            ))}
          </ul>
        )}
      </LoadState>
    </div>
  )
}

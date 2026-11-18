import { useState, type ReactNode } from 'react'
import { useAuth } from '../../auth/auth'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Popover from '../../components/ui/Popover'
import type { CrmContactChange, UserDetail, UserSegment } from '../../data/types'
import { OUTCOMES, STAGES, TAGS } from './crmLabels'
import { dayKey, daysAgo, formatShortDate, fromDayKey } from './istFormat'
import LogContactForm from './LogContactForm'
import { nextStep } from './nextStep'
import { useCrmContact, useHqMembers, useNotes, useUpdateContact } from './useCrm'
import { useUserActivitySummary, useUserSegments } from './useUsers'

const TONES = { urgent: 'text-amber-700', normal: 'text-gray-900', quiet: 'text-gray-500' }

// "rahul.sharma@example.com" → "rahul.sharma". HQ users have no names on file.
function shortName(email: string) {
  return email.split('@')[0]
}

// One choice in a popover, with a tick when it's the current one
function Option({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
    >
      {children}
      {selected && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4 text-brand-600">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
    </button>
  )
}

function FollowUpEditor({ current, onSave }: { current: Date | null; onSave: (date: Date | null) => void }) {
  const [value, setValue] = useState(current ? dayKey(current) : '')
  return (
    <div className="space-y-2 p-1">
      <Input type="date" value={value} onChange={(event) => setValue(event.target.value)} aria-label="Follow-up date" />
      <div className="flex gap-2">
        <Button variant="primary" disabled={!value} onClick={() => onSave(fromDayKey(value))}>
          Save
        </Button>
        {current && <Button onClick={() => onSave(null)}>Clear</Button>}
      </div>
    </div>
  )
}

// The CRM part of the user panel header: status chips, what to do next, and the last contact.
// Support sees the same line read-only.
export default function CrmStatus({ user }: { user: UserDetail }) {
  const hqUser = useAuth()
  const me = hqUser?.email ?? ''
  const canEdit = hqUser?.role === 'admin' || hqUser?.role === 'sales'
  const [now] = useState(Date.now)
  const [logging, setLogging] = useState(false)
  const contact = useCrmContact(user.id)
  const notes = useNotes(user.id)
  const summary = useUserActivitySummary(user.id)
  const segments = useUserSegments()
  const members = useHqMembers()
  const update = useUpdateContact(user.id, me)

  if (contact.isError) return <p className="text-sm text-red-600">Couldn't load CRM details</p>
  if (!contact.data) return <div className="h-16 animate-pulse rounded-lg bg-gray-100" />

  const crm = contact.data
  const save = (change: CrmContactChange, close?: () => void) => {
    update.mutate(change)
    close?.()
  }
  // Keep a past owner in the list even if they've left the team
  const owners = members.data?.map((member) => member.email) ?? []
  if (crm.ownerEmail && !owners.includes(crm.ownerEmail)) owners.push(crm.ownerEmail)

  const userSegments = segments.data
    ? (Object.keys(segments.data) as UserSegment[]).filter((id) => segments.data![id].some((u) => u.id === user.id))
    : []
  const step =
    summary.data && (segments.data || segments.isError)
      ? nextStep({ user, contact: crm, expenseCount: summary.data.totals.expenses, segments: userSegments, now })
      : undefined
  const lastNote = notes.data?.[0]

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Popover label="Stage" disabled={!canEdit} trigger={STAGES.find((s) => s.id === crm.stage)!.label}>
          {(close) =>
            STAGES.map((stage) => (
              <Option key={stage.id} selected={crm.stage === stage.id} onClick={() => save({ stage: stage.id }, close)}>
                {stage.label}
              </Option>
            ))
          }
        </Popover>

        <Popover
          label="Owner"
          disabled={!canEdit}
          trigger={crm.ownerEmail ? `Owner: ${crm.ownerEmail === me ? 'you' : shortName(crm.ownerEmail)}` : 'Unassigned'}
        >
          {(close) => (
            <>
              {owners.map((email) => (
                <Option key={email} selected={crm.ownerEmail === email} onClick={() => save({ ownerEmail: email }, close)}>
                  {email === me ? `${email} (you)` : email}
                </Option>
              ))}
              <Option selected={!crm.ownerEmail} onClick={() => save({ ownerEmail: null }, close)}>
                Unassigned
              </Option>
            </>
          )}
        </Popover>

        <Popover
          label="Follow-up date"
          disabled={!canEdit}
          trigger={crm.nextFollowUpAt ? `Follow up ${formatShortDate(crm.nextFollowUpAt)}` : 'No follow-up'}
        >
          {(close) => <FollowUpEditor current={crm.nextFollowUpAt} onSave={(date) => save({ nextFollowUpAt: date }, close)} />}
        </Popover>

        {(canEdit || crm.tags.length > 0) && (
          <Popover
            label="Tags"
            disabled={!canEdit}
            trigger={
              crm.tags.length ? TAGS.filter((tag) => crm.tags.includes(tag.id)).map((tag) => tag.label).join(', ') : '+ Tag'
            }
          >
            {() =>
              TAGS.map((tag) => {
                const selected = crm.tags.includes(tag.id)
                return (
                  <Option
                    key={tag.id}
                    selected={selected}
                    onClick={() => save({ tags: selected ? crm.tags.filter((t) => t !== tag.id) : [...crm.tags, tag.id] })}
                  >
                    {tag.label}
                  </Option>
                )
              })
            }
          </Popover>
        )}

        {canEdit && crm.ownerEmail !== me && (
          <button
            type="button"
            onClick={() => save({ ownerEmail: me })}
            className="px-1 text-xs font-medium text-brand-800 hover:underline"
          >
            Assign to me
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        {step ? (
          <p className={`text-sm font-medium ${TONES[step.tone]}`}>{step.text}</p>
        ) : (
          <div className="h-5 w-64 animate-pulse rounded bg-gray-100" />
        )}
        {canEdit && !logging && (
          <Button variant="primary" onClick={() => setLogging(true)}>
            Log a contact
          </Button>
        )}
      </div>

      {notes.data && (
        <p className="text-xs text-gray-500">
          {lastNote
            ? `Last contact ${daysAgo(lastNote.createdAt, now)} by ${shortName(lastNote.authorEmail)}: ${
                OUTCOMES.find((o) => o.id === lastNote.outcome)!.label
              }`
            : 'Not contacted yet'}
        </p>
      )}

      {update.isError && <p className="text-sm text-red-600">Couldn't save: {update.error.message}</p>}

      {logging && (
        <LogContactForm userId={user.id} by={me} currentFollowUp={crm.nextFollowUpAt} onDone={() => setLogging(false)} />
      )}
    </div>
  )
}

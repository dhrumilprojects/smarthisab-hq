import type { ReactNode } from 'react'
import { useAuth } from '../../auth/auth'
import Chip from '../../components/ui/Chip'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import type { CrmStage } from '../../data/types'
import { STAGES, TAGS } from './crmLabels'
import { dayKey, formatDate, formatTime, fromDayKey } from './istFormat'
import { useCrmContact, useHqMembers, useUpdateContact } from './useCrm'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-500">{label}</span>
      {children}
    </label>
  )
}

// Stage, owner, follow-up date and tags. Each change saves right away. Support sees them read-only.
export default function CrmFields({ userId }: { userId: string }) {
  const hqUser = useAuth()
  const canEdit = hqUser?.role === 'admin' || hqUser?.role === 'sales'
  const { data: contact, isError } = useCrmContact(userId)
  const members = useHqMembers()
  const update = useUpdateContact(userId, hqUser?.email ?? '')

  if (isError) return <p className="text-sm text-red-600">Couldn't load CRM details</p>
  if (!contact) return <div className="h-24 animate-pulse rounded-lg bg-gray-100" />

  // Keep a past owner in the list even if they've left the team
  const owners = members.data?.map((member) => member.email) ?? []
  if (contact.ownerEmail && !owners.includes(contact.ownerEmail)) owners.push(contact.ownerEmail)
  const disabled = !canEdit || update.isPending

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Stage">
          <Select
            value={contact.stage}
            disabled={disabled}
            onChange={(event) => update.mutate({ stage: event.target.value as CrmStage })}
          >
            {STAGES.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Owner">
          <Select
            value={contact.ownerEmail ?? ''}
            disabled={disabled}
            onChange={(event) => update.mutate({ ownerEmail: event.target.value || null })}
          >
            <option value="">Nobody</option>
            {owners.map((email) => (
              <option key={email} value={email}>
                {email === hqUser?.email ? `${email} (me)` : email}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Next follow-up">
          <Input
            type="date"
            value={contact.nextFollowUpAt ? dayKey(contact.nextFollowUpAt) : ''}
            disabled={disabled}
            onChange={(event) =>
              update.mutate({ nextFollowUpAt: event.target.value ? fromDayKey(event.target.value) : null })
            }
          />
        </Field>
        <Field label="Last contacted">
          <span className="py-1.5 text-sm text-gray-900">
            {contact.lastContactedAt
              ? `${formatDate(contact.lastContactedAt)}, ${formatTime(contact.lastContactedAt)}`
              : 'Never'}
          </span>
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TAGS.map((tag) => {
          const selected = contact.tags.includes(tag.id)
          return (
            <Chip
              key={tag.id}
              selected={selected}
              disabled={disabled}
              onClick={() =>
                update.mutate({
                  tags: selected ? contact.tags.filter((t) => t !== tag.id) : [...contact.tags, tag.id],
                })
              }
            >
              {tag.label}
            </Chip>
          )
        })}
      </div>

      {update.isError && <p className="text-sm text-red-600">Couldn't save: {update.error.message}</p>}
    </div>
  )
}

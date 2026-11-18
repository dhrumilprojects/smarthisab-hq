import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { crmRepo } from '../../data'
import type { CrmContactChange, NoteInput } from '../../data/types'

// Every CRM query starts with 'crm', so one invalidate refreshes stages, follow-ups and the panel together
export function useCrmContact(userId: string) {
  return useQuery({ queryKey: ['crm', 'contact', userId], queryFn: () => crmRepo.getContact(userId) })
}

export function useStages(userIds: string[]) {
  return useQuery({
    queryKey: ['crm', 'stages', userIds],
    queryFn: () => crmRepo.getStages(userIds),
    enabled: userIds.length > 0,
  })
}

export function useDoNotContactIds() {
  return useQuery({ queryKey: ['crm', 'doNotContact'], queryFn: crmRepo.getDoNotContactIds })
}

export function useFollowUpsDue(ownerEmail: string | undefined) {
  return useQuery({
    queryKey: ['crm', 'followUps', ownerEmail],
    queryFn: () => crmRepo.getFollowUpsDue(ownerEmail!),
    enabled: ownerEmail !== undefined,
  })
}

export function useHqMembers() {
  return useQuery({ queryKey: ['crm', 'members'], queryFn: crmRepo.getHqMembers, staleTime: 10 * 60 * 1000 })
}

export function useNotes(userId: string) {
  return useQuery({ queryKey: ['crm', 'notes', userId], queryFn: () => crmRepo.getNotes(userId) })
}

function useCrmMutation<T>(mutationFn: (input: T) => Promise<void>) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm'] }) })
}

export function useUpdateContact(userId: string, by: string) {
  return useCrmMutation((change: CrmContactChange) => crmRepo.updateContact(userId, change, by))
}

export function useAddNote(userId: string, by: string) {
  return useCrmMutation((note: NoteInput) => crmRepo.addNote(userId, note, by))
}

export function useUpdateNote(userId: string) {
  return useCrmMutation(({ id, ...note }: NoteInput & { id: string }) => crmRepo.updateNote(userId, id, note))
}

export function useDeleteNote(userId: string) {
  return useCrmMutation((noteId: string) => crmRepo.deleteNote(userId, noteId))
}

import type { CrmContact, CrmContactChange, CrmNote, CrmStage, HqMember, NoteInput, User } from './types'

// Sales notes about app users. `by` is the signed-in HQ user's email.
export type CrmRepo = {
  getContact(userId: string): Promise<CrmContact>
  // Stage of each user. Users nobody has touched are left out (stage New).
  getStages(userIds: string[]): Promise<Record<string, CrmStage>>
  // IDs of users marked "Do not contact"
  getDoNotContactIds(): Promise<string[]>
  // Users this HQ member owns whose follow-up day is today (IST) or earlier, soonest first
  getFollowUpsDue(ownerEmail: string): Promise<User[]>
  updateContact(userId: string, change: CrmContactChange, by: string): Promise<void>
  // Newest first
  getNotes(userId: string): Promise<CrmNote[]>
  // Also sets the contact's last contacted time
  addNote(userId: string, note: NoteInput, by: string): Promise<void>
  // Only the author can change or delete a note
  updateNote(userId: string, noteId: string, note: NoteInput): Promise<void>
  deleteNote(userId: string, noteId: string): Promise<void>
  // Everyone who can sign in to HQ, to pick an owner from
  getHqMembers(): Promise<HqMember[]>
}

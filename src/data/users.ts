import type { UsersPage } from './types'

export type UsersRepo = {
  // Newest first, 25 per page. Pass the previous page's nextCursor to get the next page.
  getUsers(cursor?: string): Promise<UsersPage>
  // How many users getUsers can list. Users without a sign-up date can't be sorted, so they're left out.
  countListedUsers(): Promise<number>
  // Permanently deletes the user's account and all their data. Admins only.
  deleteUser(id: string): Promise<void>
}

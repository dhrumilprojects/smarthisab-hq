import type { UsersPage } from './types'

export type UsersRepo = {
  // Newest first, 25 per page. Pass the previous page's nextCursor to get the next page.
  getUsers(cursor?: string): Promise<UsersPage>
  // Permanently deletes the user's account and all their data. Admins only.
  deleteUser(id: string): Promise<void>
}

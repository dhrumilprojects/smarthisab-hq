import type { UsersPage } from './types'

export type UsersRepo = {
  // Newest first. Pass the previous page's nextCursor to continue.
  getUsers(cursor?: string): Promise<UsersPage>
}

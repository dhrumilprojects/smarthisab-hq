import type { ActivityFilter, ActivityPage, ActivitySummary, UserDetail, UserSegments, UsersPage } from './types'

export type UsersRepo = {
  // Newest first, 25 per page. Pass the previous page's nextCursor to get the next page.
  getUsers(cursor?: string): Promise<UsersPage>
  // How many users getUsers can list. Users without a sign-up date can't be sorted, so they're left out.
  countListedUsers(): Promise<number>
  // Permanently deletes the user's account and all their data. Admins only.
  deleteUser(id: string): Promise<void>
  // Null when there's no such user
  getUserDetail(id: string): Promise<UserDetail | null>
  // Totals, recent counts and usual entry time
  getUserActivitySummary(id: string): Promise<ActivitySummary>
  // Newest first, 50 per page. Pass the previous page's nextCursor to get the next page.
  getUserActivity(id: string, filter: ActivityFilter, cursor?: string): Promise<ActivityPage>
  // Every user sorted into the four filters at once, so the page can show a count for each.
  // Reads all users, so cache the result.
  getUserSegments(): Promise<UserSegments>
}

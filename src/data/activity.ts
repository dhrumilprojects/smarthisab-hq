import type { ActivityFeedFilter, FeedPage } from './types'

export type ActivityRepo = {
  // Calls onChange with the newest 50 entries of everyone now, and again whenever something new is added.
  // Never holds amounts (except plan payments) or people's names. Returns a function that stops it.
  subscribeToActivity(filter: ActivityFeedFilter, onChange: (page: FeedPage) => void, onError: () => void): () => void
  // The next 50 entries older than `before`, newest first
  getActivityBefore(filter: ActivityFeedFilter, before: Date): Promise<FeedPage>
}

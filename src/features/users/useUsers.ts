import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersRepo } from '../../data'
import type { ActivityFilter, UserSegments } from '../../data/types'
import { useDoNotContactIds } from './useCrm'

export function useUsers(cursor?: string) {
  return useQuery({
    queryKey: ['users', cursor],
    queryFn: () => usersRepo.getUsers(cursor),
    // Keep showing the current page while the next one loads
    placeholderData: keepPreviousData,
  })
}

export function useListedUserCount() {
  return useQuery({ queryKey: ['users', 'listedCount'], queryFn: usersRepo.countListedUsers })
}

// Reads every user, so it's computed at most every 10 minutes. Users marked "Do not contact" are left out,
// and that list is read fresh, so marking someone takes them out right away.
export function useUserSegments() {
  const segments = useQuery({
    queryKey: ['users', 'segments'],
    queryFn: usersRepo.getUserSegments,
    staleTime: 10 * 60 * 1000,
  })
  const doNotContact = useDoNotContactIds()
  const hidden = doNotContact.data

  return {
    data:
      segments.data && hidden
        ? (Object.fromEntries(
            Object.entries(segments.data).map(([id, users]) => [id, users.filter((user) => !hidden.includes(user.id))]),
          ) as UserSegments)
        : undefined,
    isError: segments.isError || doNotContact.isError,
    dataUpdatedAt: segments.dataUpdatedAt,
  }
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: usersRepo.deleteUser,
    // Dashboard counts and trial lists include the deleted user too
    onSuccess: () => queryClient.invalidateQueries(),
  })
}

export function useUserDetail(id: string) {
  return useQuery({ queryKey: ['user', id, 'detail'], queryFn: () => usersRepo.getUserDetail(id) })
}

export function useUserActivitySummary(id: string) {
  return useQuery({ queryKey: ['user', id, 'summary'], queryFn: () => usersRepo.getUserActivitySummary(id) })
}

export function useUserActivity(id: string, filter: ActivityFilter) {
  return useInfiniteQuery({
    queryKey: ['user', id, 'activity', filter],
    queryFn: ({ pageParam }) => usersRepo.getUserActivity(id, filter, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  })
}

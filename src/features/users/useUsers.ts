import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersRepo } from '../../data'
import type { ActivityFilter } from '../../data/types'

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

// Reads every user, so it's computed at most every 10 minutes
export function useUserSegments() {
  return useQuery({ queryKey: ['users', 'segments'], queryFn: usersRepo.getUserSegments, staleTime: 10 * 60 * 1000 })
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

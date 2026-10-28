import { useInfiniteQuery } from '@tanstack/react-query'
import { usersRepo } from '../data'

export function useUsers() {
  return useInfiniteQuery({
    queryKey: ['users'],
    queryFn: ({ pageParam }) => usersRepo.getUsers(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  })
}

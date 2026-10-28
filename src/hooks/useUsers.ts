import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersRepo } from '../data'

export function useUsers(cursor?: string) {
  return useQuery({
    queryKey: ['users', cursor],
    queryFn: () => usersRepo.getUsers(cursor),
    // Keep showing the current page while the next one loads
    placeholderData: keepPreviousData,
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: usersRepo.deleteUser,
    // Dashboard counts and trial lists include the deleted user too
    onSuccess: () => queryClient.invalidateQueries(),
  })
}

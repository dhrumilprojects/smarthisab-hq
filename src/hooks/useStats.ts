import { useQuery } from '@tanstack/react-query'
import { statsRepo, subscriptionsRepo } from '../data'

export function useTotalUsers() {
  return useQuery({ queryKey: ['stats', 'totalUsers'], queryFn: statsRepo.getTotalUsers })
}

export function useNewUsersThisMonth() {
  return useQuery({
    queryKey: ['stats', 'newUsersThisMonth'],
    queryFn: () => statsRepo.getNewUsersSince(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
  })
}

export function useUsersOnTrial() {
  return useQuery({ queryKey: ['stats', 'usersOnTrial'], queryFn: statsRepo.getUsersOnTrial })
}

export function usePaidSubscribers() {
  return useQuery({ queryKey: ['stats', 'paidSubscribers'], queryFn: statsRepo.getPaidSubscribers })
}

export function useSignupsPerDay(days: number) {
  return useQuery({ queryKey: ['stats', 'signupsPerDay', days], queryFn: () => statsRepo.getSignupsPerDay(days) })
}

export function useTrialsEnding(days: number) {
  return useQuery({ queryKey: ['subscriptions', 'trialsEnding', days], queryFn: () => subscriptionsRepo.getTrialsEnding(days) })
}

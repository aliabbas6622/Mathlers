import { useQuery } from '@tanstack/react-query'
import { mockApiService } from '@/services/mocks/service'

export function useDashboardData() {
  const userQuery = useQuery({
    queryKey: ['user'],
    queryFn: mockApiService.getUser
  })

  const recordsQuery = useQuery({
    queryKey: ['records'],
    queryFn: mockApiService.getRecordCards
  })

  const masteryQuery = useQuery({
    queryKey: ['mastery'],
    queryFn: mockApiService.getTopicMastery
  })

  return {
    user: userQuery.data,
    records: recordsQuery.data,
    mastery: masteryQuery.data,
    isLoading: userQuery.isLoading || recordsQuery.isLoading || masteryQuery.isLoading,
    isError: userQuery.isError || recordsQuery.isError || masteryQuery.isError,
    refetch: () => {
      userQuery.refetch()
      recordsQuery.refetch()
      masteryQuery.refetch()
    }
  }
}

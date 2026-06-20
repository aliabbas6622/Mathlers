import { useQuery } from '@tanstack/react-query'
import { mockApiService } from '@/services/mocks/service'

export function useMasteryData() {
  const { data: mastery, isLoading, isError, refetch } = useQuery({
    queryKey: ['mastery'],
    queryFn: mockApiService.getTopicMastery
  })

  return {
    mastery,
    isLoading,
    isError,
    refetch
  }
}

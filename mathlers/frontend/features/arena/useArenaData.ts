import { useQuery } from '@tanstack/react-query'
import { mockApiService } from '@/services/mocks/service'

export function useArenaData() {
  const { data: question, isLoading, isError, refetch } = useQuery({
    queryKey: ['question'],
    queryFn: mockApiService.generateQuestion
  })

  return {
    question,
    isLoading,
    isError,
    refetch
  }
}

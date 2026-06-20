import { mockUser, mockRecordCards, mockQuestion, mockMastery } from "./data"
import { Question, RecordCard, User, TopicMastery } from "../../types"

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const mockApiService = {
  getUser: async (): Promise<User> => {
    await delay(500)
    return mockUser
  },

  getRecordCards: async (): Promise<RecordCard[]> => {
    await delay(800)
    return mockRecordCards
  },

  generateQuestion: async (): Promise<Question> => {
    await delay(1000)
    return mockQuestion
  },

  getTopicMastery: async (): Promise<TopicMastery[]> => {
    await delay(600)
    return mockMastery
  }
}

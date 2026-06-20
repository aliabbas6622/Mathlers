import { Question, RecordCard, User, TopicMastery, Match } from "../../types"

export const mockUser: User = {
  id: "usr_123",
  username: "MathChamp2026",
  email: "champ@example.com",
  role: "student",
  belt: "Green",
  elo: 1450,
  streak: 12
}

export const mockRecordCards: RecordCard[] = [
  {
    id: "rec_1",
    title: "MLBB M7 World Championship Peak Viewers",
    holder: "Mobile Legends",
    value: "5,680,511",
    unit: "Viewers",
    category: "Esports",
    date: "Aug 15, 2026",
    source: "Esports Charts"
  },
  {
    id: "rec_2",
    title: "Esports World Cup 2026 Prize Pool",
    holder: "Esports World Cup",
    value: "75,000,000",
    unit: "USD",
    category: "Esports",
    date: "July 20, 2026",
    source: "Official Press"
  }
]

export const mockQuestion: Question = {
  id: "q_1",
  question_text: "A soccer team scored 20 goals last season and 25 goals this season. What is the percentage increase?",
  question_type: "multiple_choice",
  options: [
    { id: "a", text: "20%" },
    { id: "b", text: "25%" },
    { id: "c", text: "30%" },
    { id: "d", text: "35%" }
  ],
  correct_option_id: "b",
  solution_steps: [
    "Find the increase: 25 - 20 = 5 goals",
    "Divide by original: 5 ÷ 20 = 0.25",
    "Convert to percentage: 0.25 × 100 = 25%"
  ],
  difficulty: "medium",
  math_topics: ["percentage_change"],
  time_limit_seconds: 60,
  record_card: mockRecordCards[0]
}

export const mockMastery: TopicMastery[] = [
  { topic: 'Algebra', mastery: 85, trend: "+2.4%", accuracy: 92, avg_time_seconds: 5.2 },
  { topic: 'Arithmetic', mastery: 94, trend: "+1.1%", accuracy: 96, avg_time_seconds: 3.1 },
  { topic: 'Percentages', mastery: 92, trend: "+4.5%", accuracy: 94, avg_time_seconds: 4.8 },
  { topic: 'Ratios', mastery: 64, trend: "-1.2%", accuracy: 72, avg_time_seconds: 8.5 }
]

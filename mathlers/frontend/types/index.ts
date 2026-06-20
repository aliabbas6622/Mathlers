export type UserRole = 'admin' | 'moderator' | 'teacher' | 'parent' | 'student' | 'guest';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  belt: string;
  elo: number;
  streak: number;
}

export interface RecordCard {
  id: string;
  title: string;
  holder: string;
  value: number | string;
  unit: string;
  category: string;
  date: string;
  source: string;
  previous_value?: number | string;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'numeric' | 'word_problem';
  options: QuestionOption[];
  correct_option_id?: string;
  solution_steps: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  math_topics: string[];
  time_limit_seconds: number;
  record_card?: RecordCard;
}

export interface TopicMastery {
  topic: string;
  mastery: number; // 0-100
  trend: string; // e.g. "+2.4%"
  accuracy: number;
  avg_time_seconds: number;
}

export interface MatchSettings {
  match_type: 'practice' | 'sparring' | 'ranked' | 'tournament';
  max_players: number;
  time_per_question: number;
  total_questions: number;
}

export interface Match {
  id: string;
  code: string;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  players: {
    user_id: string;
    username: string;
    joined_at: string;
  }[];
  settings: MatchSettings;
}

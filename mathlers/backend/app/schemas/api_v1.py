from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: str

class UserProfile(UserBase):
    id: str
    role: str
    belt: str
    elo: int
    streak: int
    created_at: datetime

class QuestionOption(BaseModel):
    id: str
    text: str

class QuestionSchema(BaseModel):
    id: str
    question_text: str
    options: List[QuestionOption]
    difficulty: str
    math_topic: str
    round_type: str
    record_card_id: Optional[int]

class MatchSettingsSchema(BaseModel):
    match_type: str
    max_players: int
    time_per_question: int
    total_questions: int

class MatchSchema(BaseModel):
    id: str
    code: str
    status: str
    settings: MatchSettingsSchema
    current_round: int
    players: List[Dict[str, Any]]

class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    belt: str
    elo: int
    win_rate: float

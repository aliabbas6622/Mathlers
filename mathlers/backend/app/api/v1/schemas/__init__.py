"""
Mathlers API Schemas (Pydantic Models)
Request/Response validation schemas for all endpoints
"""

from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# ==================== ENUMS ====================

class RoleEnum(str, Enum):
    ADMIN = "admin"
    MODERATOR = "moderator"
    TEACHER = "teacher"
    PARENT = "parent"
    STUDENT = "student"
    GUEST = "guest"


class DifficultyEnum(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EXPERT = "expert"


class AgeGroupEnum(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class MathTopicEnum(str, Enum):
    BASIC_ARITHMETIC = "basic_arithmetic"
    ARITHMETIC = "arithmetic"
    PERCENTAGES = "percentages"
    RATIOS = "ratios"
    ALGEBRA = "algebra"
    GEOMETRY = "geometry"
    PROBABILITY = "probability"
    STATISTICS = "statistics"
    TIME_SPEED_DISTANCE = "time_speed_distance"
    FINANCIAL_MATH = "financial_math"


# ==================== AUTH SCHEMAS ====================

class UserRegister(BaseModel):
    """Registration request schema"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=8)
    role: RoleEnum = RoleEnum.STUDENT
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserLogin(BaseModel):
    """Login request schema"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Token response schema"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenRefresh(BaseModel):
    """Refresh token request schema"""
    refresh_token: str


class UserResponse(BaseModel):
    """User response schema (excludes sensitive data)"""
    id: int
    email: str
    username: str
    role: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """User update schema"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    username: Optional[str] = None


class PasswordChange(BaseModel):
    """Password change schema"""
    current_password: str
    new_password: str = Field(..., min_length=8)
    
    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


# ==================== QUESTION SCHEMAS ====================

class QuestionBase(BaseModel):
    """Base question schema"""
    scenario: str
    question_text: str
    question_type: str
    difficulty: DifficultyEnum
    math_topic: MathTopicEnum
    time_limit_seconds: int = 60
    points_base: int = 100


class QuestionCreate(QuestionBase):
    """Question creation schema"""
    options: Optional[List[str]] = None
    correct_answer: str
    correct_option_index: Optional[int] = None
    step_by_step_solution: Optional[str] = None
    explanation: Optional[str] = None
    record_card_id: Optional[int] = None


class QuestionResponse(QuestionBase):
    """Question response schema"""
    id: int
    options: Optional[List[str]] = None
    correct_option_index: Optional[int] = None
    step_by_step_solution: Optional[str] = None
    explanation: Optional[str] = None
    times_used: int = 0
    correct_rate: Optional[float] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class QuestionFilter(BaseModel):
    """Question filtering parameters"""
    difficulty: Optional[DifficultyEnum] = None
    math_topic: Optional[MathTopicEnum] = None
    age_group: Optional[AgeGroupEnum] = None
    min_points: Optional[int] = None
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


# ==================== MATCH SCHEMAS ====================

class MatchModeEnum(str, Enum):
    PRACTICE = "practice"
    SPARRING = "sparring"
    RANKED = "ranked"
    TOURNAMENT = "tournament"


class MatchCreate(BaseModel):
    """Match creation request"""
    mode: MatchModeEnum = MatchModeEnum.SPARRING
    opponent_id: Optional[int] = None  # None for random matchmaking
    time_limit: int = Field(default=300, ge=60, le=1800)


class MatchResponse(BaseModel):
    """Match response schema"""
    id: int
    mode: str
    status: str
    participants: List[UserResponse]
    winner_id: Optional[int] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class MatchJoin(BaseModel):
    """Join match request"""
    match_id: int


# ==================== RECORD CARD SCHEMAS ====================

class RecordCategoryEnum(str, Enum):
    SPORTS = "sports"
    ESPORTS = "esports"
    GAMING = "gaming"
    SCIENCE = "science"
    ENTERTAINMENT = "entertainment"
    TECHNOLOGY = "technology"


class RecordCardBase(BaseModel):
    """Base record card schema"""
    title: str
    description: str
    holder: Optional[str] = None
    value: float
    unit: str
    category: RecordCategoryEnum
    subcategory: Optional[str] = None


class RecordCardCreate(RecordCardBase):
    """Record card creation schema"""
    previous_value: Optional[float] = None
    previous_holder: Optional[str] = None
    date: Optional[datetime] = None
    source: Optional[str] = None
    source_url: Optional[str] = None
    difficulty_tags: Optional[List[str]] = None
    math_topics: Optional[List[MathTopicEnum]] = None


class RecordCardResponse(RecordCardBase):
    """Record card response schema"""
    id: int
    verified: bool
    usage_count: int
    created_at: datetime
    last_updated: datetime
    
    class Config:
        from_attributes = True


# ==================== RESPONSE WRAPPER ====================

class APIResponse(BaseModel):
    """Generic API response wrapper"""
    success: bool
    message: str
    data: Optional[Any] = None
    errors: Optional[List[str]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class PaginatedResponse(BaseModel):
    """Paginated response wrapper"""
    success: bool
    data: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int
    
    class Config:
        from_attributes = True

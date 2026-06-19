"""
Mathlers Database Models
Complete schema for Record Cards, Users, Competitions, and all platform data
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Boolean, 
    ForeignKey, Text, JSON, Enum as SQLEnum, Index,
    UniqueConstraint, CheckConstraint
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy import create_engine

Base = declarative_base()


# ==================== ENUMS ====================

class Role(Enum):
    ADMIN = "admin"
    MODERATOR = "moderator"
    TEACHER = "teacher"
    PARENT = "parent"
    STUDENT = "student"
    GUEST = "guest"


class DifficultyLevel(Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EXPERT = "expert"


class AgeGroup(Enum):
    BEGINNER = "beginner"  # 8-10
    INTERMEDIATE = "intermediate"  # 11-13
    ADVANCED = "advanced"  # 14-16
    EXPERT = "expert"  # 16+


class MathTopic(Enum):
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
    TRIGONOMETRY = "trigonometry"


class RecordCategory(Enum):
    SPORTS = "sports"
    ESPORTS = "esports"
    GAMING = "gaming"
    SCIENCE = "science"
    ENTERTAINMENT = "entertainment"
    TECHNOLOGY = "technology"


class CompetitionMode(Enum):
    PRACTICE = "practice"
    SPARRING = "sparring"
    RANKED = "ranked"
    TOURNAMENT = "tournament"


class MatchStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class RoundType(Enum):
    WARM_UP = "warm_up"
    JAB = "jab"
    HOOK = "hook"
    UPPERCUT = "uppercut"
    KNOCKOUT = "knockout"


# ==================== USER MANAGEMENT ====================

class User(Base):
    """User account with role-based access control"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    
    # Profile
    first_name = Column(String(100))
    last_name = Column(String(100))
    date_of_birth = Column(DateTime)
    age_group = Column(SQLEnum(AgeGroup), default=AgeGroup.INTERMEDIATE)
    
    # Role & Permissions
    role = Column(SQLEnum(Role), default=Role.STUDENT)
    permissions = Column(JSON, default=list)
    
    # Student-specific fields
    elo_rating = Column(Integer, default=1000)
    total_matches = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    current_streak = Column(Integer, default=0)
    best_streak = Column(Integer, default=0)
    
    # Parent-Student relationship
    parent_id = Column(Integer, ForeignKey("users.id"))
    children = relationship("User", backref="parent", remote_side=[id])
    
    # Teacher-Class relationship
    classes_taught = relationship("Class", back_populates="teacher")
    
    # Account status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_banned = Column(Boolean, default=False)
    ban_reason = Column(Text)
    ban_until = Column(DateTime)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime)
    
    # Relationships
    subscriptions = relationship("Subscription", back_populates="user")
    enrollments = relationship("Enrollment", back_populates="student")
    matches = relationship("Match", back_populates="participants", secondary="match_participants")
    badges_earned = relationship("UserBadge", back_populates="user")
    
    __table_args__ = (
        CheckConstraint('elo_rating >= 0', name='check_elo_positive'),
        Index('idx_user_role', 'role'),
        Index('idx_user_age_group', 'age_group'),
    )


class Permission(Base):
    """Granular permissions for RBAC"""
    __tablename__ = "permissions"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    category = Column(String(50))  # e.g., 'user_management', 'content', 'system'
    
    roles = relationship("RolePermission", back_populates="permission")


class RolePermission(Base):
    """Many-to-many relationship between roles and permissions"""
    __tablename__ = "role_permissions"
    
    role_id = Column(Integer, ForeignKey("roles.id"), primary_key=True)
    permission_id = Column(Integer, ForeignKey("permissions.id"), primary_key=True)
    
    role = relationship("Role", back_populates="permissions")
    permission = relationship("Permission", back_populates="roles")


class Role(Base):
    """Role definitions"""
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    level = Column(Integer, default=0)
    description = Column(Text)
    
    permissions = relationship("RolePermission", back_populates="role")
    users = relationship("User", back_populates="role_ref")


# ==================== SCHOOL & CLASS MANAGEMENT ====================

class School(Base):
    """School/Organization entity"""
    __tablename__ = "schools"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    address = Column(Text)
    country = Column(String(100))
    subscription_tier = Column(String(50), default="free")
    
    admin_user_id = Column(Integer, ForeignKey("users.id"))
    
    classes = relationship("Class", back_populates="school")
    created_at = Column(DateTime, default=datetime.utcnow)


class Class(Base):
    """Teacher-created class for students"""
    __tablename__ = "classes"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    grade_level = Column(String(50))
    
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    school_id = Column(Integer, ForeignKey("schools.id"))
    
    teacher = relationship("User", back_populates="classes_taught")
    school = relationship("School", back_populates="classes")
    enrollments = relationship("Enrollment", back_populates="class")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        UniqueConstraint('teacher_id', 'name', name='unique_teacher_class_name'),
    )


class Enrollment(Base):
    """Student enrollment in a class"""
    __tablename__ = "enrollments"
    
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    
    student = relationship("User", back_populates="enrollments")
    class_ = relationship("Class", back_populates="enrollments")
    
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    __table_args__ = (
        UniqueConstraint('student_id', 'class_id', name='unique_enrollment'),
    )


# ==================== RECORD CARDS (Real-World Data) ====================

class RecordCard(Base):
    """Real-world record data used for question generation"""
    __tablename__ = "record_cards"
    
    id = Column(Integer, primary_key=True)
    
    # Core record information
    title = Column(String(255), nullable=False)
    description = Column(Text)
    holder = Column(String(255))  # Who holds the record
    numeric_value = Column(Float, nullable=False)  # The actual record number
    unit = Column(String(50))  # e.g., "seconds", "dollars", "viewers"
    
    # Previous record for comparison questions
    previous_value = Column(Float)
    previous_holder = Column(String(255))
    
    # Metadata
    date_achieved = Column(DateTime)
    category = Column(SQLEnum(RecordCategory), nullable=False)
    subcategory = Column(String(100))  # e.g., "MOBA", "FPS" for esports
    location = Column(String(255))
    source = Column(String(255))  # API or website source
    source_url = Column(Text)
    
    # Difficulty tagging
    difficulty_tags = Column(JSON)  # ["easy", "medium"]
    age_ranges = Column(JSON)  # ["beginner", "intermediate"]
    math_topics = Column(JSON)  # ["percentages", "ratios"]
    
    # Data freshness
    is_verified = Column(Boolean, default=False)
    last_updated = Column(DateTime, default=datetime.utcnow)
    update_frequency = Column(String(50))  # "daily", "hourly", "weekly"
    
    # Usage tracking
    usage_count = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    questions = relationship("Question", back_populates="record_card")
    
    __table_args__ = (
        Index('idx_record_category', 'category'),
        Index('idx_record_difficulty', 'difficulty_tags', postgresql_using='gin'),
        Index('idx_record_date', 'date_achieved'),
    )


# ==================== QUESTION GENERATION ====================

class Question(Base):
    """Generated math questions based on record cards"""
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True)
    
    # Content
    scenario = Column(Text, nullable=False)  # The boxing ring narrative
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50))  # "multiple_choice", "numeric", "word_problem"
    
    # Answers
    options = Column(JSON)  # For multiple choice: ["A", "B", "C", "D"]
    correct_answer = Column(String(255), nullable=False)
    correct_option_index = Column(Integer)  # For multiple choice
    
    # Solution
    step_by_step_solution = Column(Text)
    explanation = Column(Text)
    
    # Metadata
    difficulty = Column(SQLEnum(DifficultyLevel), nullable=False)
    age_group = Column(SQLEnum(AgeGroup))
    math_topic = Column(SQLEnum(MathTopic))
    
    # Boxing round context
    round_type = Column(SQLEnum(RoundType), default=RoundType.WARM_UP)
    time_limit_seconds = Column(Integer, default=60)
    points_base = Column(Integer, default=100)
    
    # Knockout round bonus
    is_knockout = Column(Boolean, default=False)
    knockout_multiplier = Column(Float, default=1.0)
    
    # Source record
    record_card_id = Column(Integer, ForeignKey("record_cards.id"))
    record_card = relationship("RecordCard", back_populates="questions")
    
    # Validation
    is_validated = Column(Boolean, default=False)
    validation_score = Column(Float)  # AI confidence score
    flagged_reason = Column(Text)
    
    # Usage statistics
    times_used = Column(Integer, default=0)
    correct_rate = Column(Float)  # Percentage of users who got it right
    avg_time_taken = Column(Float)  # Average seconds to answer
    
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(100))  # AI model identifier
    
    __table_args__ = (
        Index('idx_question_difficulty', 'difficulty'),
        Index('idx_question_topic', 'math_topic'),
        Index('idx_question_age', 'age_group'),
    )


class QuestionTemplate(Base):
    """Templates for question generation"""
    __tablename__ = "question_templates"
    
    id = Column(Integer, primary_key=True)
    
    name = Column(String(100), nullable=False)
    template_text = Column(Text, nullable=False)  # With placeholders
    math_operation = Column(String(50))  # Type of math required
    
    difficulty = Column(SQLEnum(DifficultyLevel))
    age_groups = Column(JSON)
    topics = Column(JSON)
    
    example_input = Column(JSON)
    example_output = Column(JSON)
    
    is_active = Column(Boolean, default=True)
    usage_count = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)


# ==================== COMPETITIONS & MATCHES ====================

class Match(Base):
    """A competition match between students"""
    __tablename__ = "matches"
    
    id = Column(Integer, primary_key=True)
    
    # Match configuration
    mode = Column(SQLEnum(CompetitionMode), nullable=False)
    status = Column(SQLEnum(MatchStatus), default=MatchStatus.PENDING)
    
    # Tournament reference (if applicable)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"))
    bracket_round = Column(Integer)  # 1 = finals, 2 = semifinals, etc.
    bracket_position = Column(Integer)
    
    # Participants (many-to-many)
    participants = relationship(
        "User",
        secondary="match_participants",
        back_populates="matches"
    )
    
    # Winner
    winner_id = Column(Integer, ForeignKey("users.id"))
    winner = relationship("User", foreign_keys=[winner_id])
    
    # Scoring
    duration_seconds = Column(Integer)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    
    # Relationships
    rounds = relationship("MatchRound", back_populates="match")
    tournament = relationship("Tournament", back_populates="matches")
    
    __table_args__ = (
        Index('idx_match_status', 'status'),
        Index('idx_match_mode', 'mode'),
        Index('idx_match_created', 'created_at'),
    )


class MatchParticipant(Base):
    """Link table for match participants"""
    __tablename__ = "match_participants"
    
    match_id = Column(Integer, ForeignKey("matches.id"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    
    score = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    wrong_answers = Column(Integer, default=0)
    fastest_answer_time = Column(Float)
    streak_best = Column(Integer, default=0)
    
    # ELO changes
    elo_before = Column(Integer)
    elo_after = Column(Integer)
    elo_change = Column(Integer)
    
    joined_at = Column(DateTime, default=datetime.utcnow)


class MatchRound(Base):
    """Individual round within a match"""
    __tablename__ = "match_rounds"
    
    id = Column(Integer, primary_key=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    
    round_type = Column(SQLEnum(RoundType), nullable=False)
    round_number = Column(Integer, nullable=False)
    
    questions = relationship("MatchQuestion", back_populates="round")
    match = relationship("Match", back_populates="rounds")
    
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    
    __table_args__ = (
        UniqueConstraint('match_id', 'round_number', name='unique_match_round'),
    )


class MatchQuestion(Base):
    """Question instance within a match round"""
    __tablename__ = "match_questions"
    
    id = Column(Integer, primary_key=True)
    round_id = Column(Integer, ForeignKey("match_rounds.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    
    round = relationship("MatchRound", back_populates="questions")
    question = relationship("Question")
    
    # User responses (stored as JSON for all participants)
    responses = Column(JSON)  # {user_id: {"answer": "A", "time_taken": 5.2, "correct": true}}
    
    presented_at = Column(DateTime, default=datetime.utcnow)


# ==================== TOURNAMENTS ====================

class Tournament(Base):
    """Organized tournament with brackets"""
    __tablename__ = "tournaments"
    
    id = Column(Integer, primary_key=True)
    
    name = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Configuration
    mode = Column(SQLEnum(CompetitionMode), default=CompetitionMode.TOURNAMENT)
    format = Column(String(50))  # "single_elimination", "double_elimination", "round_robin"
    max_participants = Column(Integer)
    bracket_size = Column(Integer)  # 4, 8, 16, 32, 64
    
    # Eligibility
    min_age_group = Column(SQLEnum(AgeGroup))
    max_age_group = Column(SQLEnum(AgeGroup))
    min_elo = Column(Integer)
    
    # Schedule
    registration_opens = Column(DateTime)
    registration_closes = Column(DateTime)
    starts_at = Column(DateTime)
    ends_at = Column(DateTime)
    
    # Status
    status = Column(String(50), default="registration")  # registration, ongoing, completed
    current_round = Column(Integer)
    
    # Prize
    prize_pool = Column(Float)
    prize_distribution = Column(JSON)  # {1: 0.5, 2: 0.3, 3: 0.2}
    
    # Organizer
    organizer_id = Column(Integer, ForeignKey("users.id"))
    organizer = relationship("User", foreign_keys=[organizer_id])
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    matches = relationship("Match", back_populates="tournament")
    registrations = relationship("TournamentRegistration", back_populates="tournament")
    
    __table_args__ = (
        Index('idx_tournament_status', 'status'),
        Index('idx_tournament_starts', 'starts_at'),
    )


class TournamentRegistration(Base):
    """Tournament participant registration"""
    __tablename__ = "tournament_registrations"
    
    id = Column(Integer, primary_key=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    tournament = relationship("Tournament", back_populates="registrations")
    user = relationship("User")
    
    registered_at = Column(DateTime, default=datetime.utcnow)
    seed = Column(Integer)  # Seeding position
    final_rank = Column(Integer)
    
    __table_args__ = (
        UniqueConstraint('tournament_id', 'user_id', name='unique_tournament_registration'),
    )


# ==================== GAMIFICATION ====================

class UserBadge(Base):
    """Badges earned by users"""
    __tablename__ = "user_badges"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    badge_id = Column(Integer, ForeignKey("badges.id"), nullable=False)
    
    user = relationship("User", back_populates="badges_earned")
    badge = relationship("Badge")
    
    earned_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        UniqueConstraint('user_id', 'badge_id', name='unique_user_badge'),
    )


class Badge(Base):
    """Achievement badges"""
    __tablename__ = "badges"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    icon = Column(String(50))  # Emoji or icon name
    
    criteria = Column(JSON)  # Conditions to earn this badge
    category = Column(String(50))
    
    is_active = Column(Boolean, default=True)
    
    users = relationship("UserBadge", back_populates="badge")


class Belt(Base):
    """Champion belt definitions"""
    __tablename__ = "belts"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    min_elo = Column(Integer, nullable=False)
    color = Column(String(20))  # Hex color
    icon_url = Column(String(255))
    
    current_holders = relationship("BeltHolder", back_populates="belt")


class BeltHolder(Base):
    """Current and historical belt holders"""
    __tablename__ = "belt_holders"
    
    id = Column(Integer, primary_key=True)
    belt_id = Column(Integer, ForeignKey("belts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    belt = relationship("Belt", back_populates="current_holders")
    user = relationship("User")
    
    won_at = Column(DateTime, default=datetime.utcnow)
    lost_at = Column(DateTime)
    is_current = Column(Boolean, default=True)
    
    defenses = Column(Integer, default=0)  # Number of successful defenses


# ==================== SUBSCRIPTIONS ====================

class Subscription(Base):
    """User subscription plans"""
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    plan_type = Column(String(50), nullable=False)  # free, premium, school
    status = Column(String(50), default="active")  # active, cancelled, expired
    
    # Billing
    price = Column(Float)
    currency = Column(String(10), default="USD")
    billing_cycle = Column(String(20))  # monthly, yearly
    
    # Period
    started_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    cancelled_at = Column(DateTime)
    
    # Payment
    payment_method_id = Column(String(255))
    last_payment_date = Column(DateTime)
    next_billing_date = Column(DateTime)
    
    user = relationship("User", back_populates="subscriptions")
    
    __table_args__ = (
        Index('idx_subscription_user', 'user_id'),
        Index('idx_subscription_status', 'status'),
    )


# ==================== ANALYTICS & PROGRESS ====================

class UserProgress(Base):
    """Tracking user progress over time"""
    __tablename__ = "user_progress"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Topic mastery
    topic = Column(SQLEnum(MathTopic), nullable=False)
    mastery_level = Column(Float, default=0)  # 0-100%
    
    # Statistics
    questions_attempted = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)
    avg_time_per_question = Column(Float)
    best_streak = Column(Integer, default=0)
    
    # Last activity
    last_practiced = Column(DateTime)
    
    user = relationship("User")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'topic', name='unique_user_topic_progress'),
    )


class ActivityLog(Base):
    """System-wide activity logging"""
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True)
    
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50))  # question, match, tournament, etc.
    entity_id = Column(Integer)
    
    details = Column(JSON)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    user = relationship("User")


# ==================== SYSTEM CONFIGURATION ====================

class SystemSetting(Base):
    """Configurable system settings"""
    __tablename__ = "system_settings"
    
    id = Column(Integer, primary_key=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(JSON, nullable=False)
    description = Column(Text)
    category = Column(String(50))
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = Column(Integer, ForeignKey("users.id"))


# ==================== CREATE ALL TABLES ====================

def create_tables(engine):
    """Create all database tables"""
    Base.metadata.create_all(engine)


def get_session(engine):
    """Get a database session"""
    Session = sessionmaker(bind=engine)
    return Session()


# Example usage:
# engine = create_engine('postgresql://user:password@localhost/mathlers')
# create_tables(engine)
# session = get_session(engine)

"""
Mathlers Question Routes
Question generation, retrieval, and management endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.api.v1.schemas import (
    QuestionResponse, QuestionFilter, APIResponse,
    DifficultyEnum, MathTopicEnum, AgeGroupEnum
)
from app.db.session import get_db
from app.models.database import Question, RecordCard, DifficultyLevel, MathTopic
from app.core.auth import get_current_user
from app.models.database import User

router = APIRouter(prefix="/questions", tags=["Questions"])


@router.get("", response_model=APIResponse)
async def get_questions(
    difficulty: Optional[DifficultyEnum] = Query(None),
    math_topic: Optional[MathTopicEnum] = Query(None),
    age_group: Optional[AgeGroupEnum] = Query(None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get paginated list of questions with optional filters"""
    
    query = db.query(Question).filter(Question.is_validated == True)
    
    if difficulty:
        query = query.filter(Question.difficulty == DifficultyLevel(difficulty.value))
    
    if math_topic:
        query = query.filter(Question.math_topic == MathTopic(math_topic.value))
    
    if age_group:
        # Map age group enum to database field if needed
        pass
    
    total = query.count()
    questions = query.offset(offset).limit(limit).all()
    
    return APIResponse(
        success=True,
        message="Questions retrieved successfully",
        data={
            "questions": [QuestionResponse.model_validate(q) for q in questions],
            "pagination": {
                "total": total,
                "limit": limit,
                "offset": offset,
                "has_more": offset + limit < total
            }
        }
    )


@router.get("/{question_id}", response_model=APIResponse)
async def get_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific question by ID"""
    
    question = db.query(Question).filter(Question.id == question_id).first()
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    return APIResponse(
        success=True,
        message="Question retrieved successfully",
        data={"question": QuestionResponse.model_validate(question)}
    )


@router.post("/generate", response_model=APIResponse)
async def generate_question(
    record_card_id: int,
    difficulty: Optional[str] = "medium",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate a new question from a record card"""
    
    # Get the record card
    record_card = db.query(RecordCard).filter(RecordCard.id == record_card_id).first()
    if not record_card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record card not found"
        )
    
    # Import question generation logic
    from app.services.question_generator import QuestionGenerator
    
    generator = QuestionGenerator()
    
    try:
        generated = generator.generate_from_record(record_card, difficulty)
        
        if not generated:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate question"
            )
        
        # Create question in database
        question = Question(
            scenario=generated.get('scenario', ''),
            question_text=generated.get('question_text', ''),
            question_type=generated.get('question_type', 'multiple_choice'),
            options=generated.get('options'),
            correct_answer=str(generated.get('correct_answer', '')),
            correct_option_index=generated.get('correct_option_index'),
            step_by_step_solution=generated.get('step_by_step_solution', ''),
            explanation=generated.get('explanation', ''),
            difficulty=DifficultyLevel(generated.get('difficulty', 'medium')),
            math_topic=MathTopic(generated.get('math_topic', 'arithmetic')),
            time_limit_seconds=generated.get('time_limit', 60),
            points_base=generated.get('points', 100),
            record_card_id=record_card.id,
            is_validated=True,
            created_by="question_engine"
        )
        
        db.add(question)
        db.commit()
        db.refresh(question)
        
        return APIResponse(
            success=True,
            message="Question generated successfully",
            data={"question": QuestionResponse.model_validate(question)}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Question generation failed: {str(e)}"
        )


@router.get("/random", response_model=APIResponse)
async def get_random_question(
    difficulty: Optional[DifficultyEnum] = Query(None),
    math_topic: Optional[MathTopicEnum] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a random question matching criteria"""
    
    query = db.query(Question).filter(Question.is_validated == True)
    
    if difficulty:
        query = query.filter(Question.difficulty == DifficultyLevel(difficulty.value))
    
    if math_topic:
        query = query.filter(Question.math_topic == MathTopic(math_topic.value))
    
    question = query.order_by(func.random()).first()
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No questions found matching criteria"
        )
    
    return APIResponse(
        success=True,
        message="Random question retrieved",
        data={"question": QuestionResponse.model_validate(question)}
    )


# Need to import func for random ordering
from sqlalchemy import func

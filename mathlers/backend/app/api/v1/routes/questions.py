from fastapi import APIRouter, Depends
from typing import List
from schemas.api_v1 import QuestionSchema
from services.question_engine import MathlersEngine

router = APIRouter()
engine = MathlersEngine()

@router.get("/generate", response_model=QuestionSchema)
def generate_question(student_id: int, round_type: str = "warm_up"):
    # This is where the platform logic is consumed
    # In a real app, we'd fetch a record and pass it to the engine
    dummy_record = {
        "id": 1,
        "title": "Sample Record",
        "value": 100,
        "unit": "points",
        "previous_value": 80,
        "category": "sports"
    }
    question = engine.generate_question(dummy_record, student_id, round_type)
    return question

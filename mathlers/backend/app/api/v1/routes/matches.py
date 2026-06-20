from fastapi import APIRouter
router = APIRouter()
@router.post("/create")
def create_match(): return {"match_id": "match_123"}

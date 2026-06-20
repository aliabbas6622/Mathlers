from fastapi import APIRouter
router = APIRouter()
@router.get("/me")
def get_me(): return {"username": "Champ2026"}

"""
Mathlers API Router
Aggregates all route modules into a single API router
"""

from fastapi import APIRouter, status
from app.api.v1.routes import auth, questions, matches, records, health

api_router = APIRouter()

# Include all route modules
api_router.include_router(auth.router, prefix="/api/v1")
api_router.include_router(questions.router, prefix="/api/v1")
api_router.include_router(matches.router, prefix="/api/v1")
api_router.include_router(records.router, prefix="/api/v1")
api_router.include_router(health.router, prefix="/api/v1")


@api_router.get("", tags=["Root"])
async def root():
    """API root endpoint"""
    return {
        "success": True,
        "message": "Welcome to Mathlers API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/health"
    }

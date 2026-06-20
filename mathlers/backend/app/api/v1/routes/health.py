"""
Mathlers Health Check Routes
System health, readiness, and liveness endpoints
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from datetime import datetime
import time

from app.api.v1.schemas import APIResponse
from app.db.session import get_db, check_db_connection, engine
from app.core.config.settings import settings

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", response_model=APIResponse)
async def health_check(db: Session = Depends(get_db)):
    """Basic health check endpoint"""
    
    return APIResponse(
        success=True,
        message="Service is healthy",
        data={
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "version": settings.APP_VERSION
        }
    )


@router.get("/ready", response_model=APIResponse)
async def readiness_check():
    """Readiness probe - checks if service can accept traffic"""
    
    # Check database connection
    db_healthy = check_db_connection()
    
    # Check if in maintenance mode
    if settings.MAINTENANCE_MODE:
        return APIResponse(
            success=False,
            message="Service is in maintenance mode",
            data={"status": "maintenance"}
        ), 503
    
    overall_health = db_healthy
    
    return APIResponse(
        success=overall_health,
        message="Service is ready" if overall_health else "Service is not ready",
        data={
            "status": "ready" if overall_health else "not_ready",
            "checks": {
                "database": "ok" if db_healthy else "failed"
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    )


@router.get("/live", response_model=APIResponse)
async def liveness_check():
    """Liveness probe - checks if service is alive"""
    
    return APIResponse(
        success=True,
        message="Service is alive",
        data={
            "status": "alive",
            "uptime_seconds": time.time(),  # Would use actual startup time in production
            "timestamp": datetime.utcnow().isoformat()
        }
    )


@router.get("/detailed", response_model=APIResponse)
async def detailed_health_check(db: Session = Depends(get_db)):
    """Detailed health check with all system components"""
    
    checks = {}
    overall_healthy = True
    
    # Database check
    try:
        db_healthy = check_db_connection()
        checks["database"] = {
            "status": "ok" if db_healthy else "failed",
            "details": f"Pool size: {engine.pool.size()}" if db_healthy else "Connection failed"
        }
        if not db_healthy:
            overall_healthy = False
    except Exception as e:
        checks["database"] = {"status": "failed", "details": str(e)}
        overall_healthy = False
    
    # Configuration check
    checks["configuration"] = {
        "status": "ok",
        "environment": settings.ENVIRONMENT,
        "debug_mode": settings.DEBUG
    }
    
    # Security check (warn if using default JWT secret)
    jwt_secure = settings.JWT_SECRET_KEY != "CHANGE_THIS_IN_PRODUCTION"
    checks["security"] = {
        "status": "ok" if jwt_secure else "warning",
        "details": "JWT secret configured" if jwt_secure else "Using default JWT secret!"
    }
    
    return APIResponse(
        success=overall_healthy,
        message="Health check complete",
        data={
            "status": "healthy" if overall_healthy else "unhealthy",
            "checks": checks,
            "timestamp": datetime.utcnow().isoformat(),
            "version": settings.APP_VERSION
        }
    )

"""
Mathlers Match Routes
Competition matchmaking, creation, and management endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import Optional, Dict, List
from datetime import datetime
import json

from app.api.v1.schemas import (
    MatchCreate, MatchResponse, MatchJoin, APIResponse,
    MatchModeEnum, UserResponse
)
from app.db.session import get_db
from app.models.database import Match, MatchParticipant, User, MatchStatus, CompetitionMode
from app.core.auth import get_current_user

router = APIRouter(prefix="/matches", tags=["Matches"])


@router.post("/create", response_model=APIResponse)
async def create_match(
    match_data: MatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new match (ranked, practice, or sparring)"""
    
    # Create the match
    match = Match(
        mode=CompetitionMode(match_data.mode.value),
        status=MatchStatus.PENDING,
        created_at=datetime.utcnow(),
    )
    
    db.add(match)
    db.commit()
    db.refresh(match)
    
    # Add creator as first participant
    participant = MatchParticipant(
        match_id=match.id,
        user_id=current_user.id,
        elo_before=current_user.elo_rating,
        joined_at=datetime.utcnow()
    )
    
    db.add(participant)
    
    # If opponent specified, add them
    if match_data.opponent_id:
        opponent = db.query(User).filter(User.id == match_data.opponent_id).first()
        if not opponent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Opponent not found"
            )
        
        opponent_participant = MatchParticipant(
            match_id=match.id,
            user_id=opponent.id,
            elo_before=opponent.elo_rating,
            joined_at=datetime.utcnow()
        )
        db.add(opponent_participant)
    
    db.commit()
    
    return APIResponse(
        success=True,
        message="Match created successfully",
        data={"match": MatchResponse.model_validate(match)}
    )


@router.get("/{match_id}", response_model=APIResponse)
async def get_match(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get match details"""
    
    match = db.query(Match).filter(Match.id == match_id).first()
    
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
    
    return APIResponse(
        success=True,
        message="Match retrieved successfully",
        data={"match": MatchResponse.model_validate(match)}
    )


@router.post("/join", response_model=APIResponse)
async def join_match(
    join_data: MatchJoin,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Join an existing match"""
    
    match = db.query(Match).filter(Match.id == join_data.match_id).first()
    
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
    
    if match.status != MatchStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Match is not accepting participants"
        )
    
    # Check if already a participant
    existing = db.query(MatchParticipant).filter(
        MatchParticipant.match_id == match.id,
        MatchParticipant.user_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already joined this match"
        )
    
    # Add as participant
    participant = MatchParticipant(
        match_id=match.id,
        user_id=current_user.id,
        elo_before=current_user.elo_rating,
        joined_at=datetime.utcnow()
    )
    
    db.add(participant)
    db.commit()
    
    return APIResponse(
        success=True,
        message="Joined match successfully",
        data={"match": MatchResponse.model_validate(match)}
    )


@router.websocket("/ws/{match_id}")
async def match_websocket(
    websocket: WebSocket,
    match_id: int,
    db: Session = Depends(get_db)
):
    """WebSocket endpoint for real-time match gameplay"""
    
    await websocket.accept()
    
    # In production, you'd validate the token here
    # For now, accept all connections
    
    # Store connection in application state
    # This would be managed by a connection manager in production
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            msg_type = message.get("type")
            
            if msg_type == "answer":
                # Process answer submission
                question_id = message.get("question_id")
                answer = message.get("answer")
                time_taken = message.get("time_taken")
                
                # Validate and score the answer
                # Update participant score
                # Broadcast to opponent
                
            elif msg_type == "ready":
                # Mark player as ready
                pass
            
            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})
            
    except WebSocketDisconnect:
        # Handle disconnection
        pass


# Simple in-memory connection tracking (use Redis in production)
active_matches: Dict[int, List[WebSocket]] = {}


def calculate_elo_change(player_rating: int, opponent_rating: int, won: bool) -> int:
    """Calculate ELO rating change after a match"""
    K_FACTOR = 32  # Standard K-factor for competitive games
    
    # Expected score based on rating difference
    expected_score = 1 / (1 + 10 ** ((opponent_rating - player_rating) / 400))
    
    # Actual score (1 = win, 0 = loss, 0.5 = draw)
    actual_score = 1 if won else 0
    
    # Calculate change
    change = int(K_FACTOR * (actual_score - expected_score))
    
    return change

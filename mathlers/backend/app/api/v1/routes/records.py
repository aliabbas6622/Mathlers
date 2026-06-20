"""
Mathlers Record Card Routes
CRUD operations for record cards used in question generation
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.api.v1.schemas import (
    RecordCardCreate, RecordCardResponse, APIResponse,
    RecordCategoryEnum, MathTopicEnum
)
from app.db.session import get_db
from app.models.database import RecordCard, RecordCategory
from app.core.auth import get_current_user
from app.models.database import User

router = APIRouter(prefix="/records", tags=["Record Cards"])


@router.get("", response_model=APIResponse)
async def get_record_cards(
    category: Optional[RecordCategoryEnum] = Query(None),
    verified: Optional[bool] = Query(None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get paginated list of record cards"""
    
    query = db.query(RecordCard)
    
    if category:
        query = query.filter(RecordCard.category == RecordCategory(category.value))
    
    if verified is not None:
        query = query.filter(RecordCard.verified == verified)
    
    total = query.count()
    records = query.offset(offset).limit(limit).all()
    
    return APIResponse(
        success=True,
        message="Record cards retrieved successfully",
        data={
            "records": [RecordCardResponse.model_validate(r) for r in records],
            "pagination": {
                "total": total,
                "limit": limit,
                "offset": offset,
                "has_more": offset + limit < total
            }
        }
    )


@router.get("/{record_id}", response_model=APIResponse)
async def get_record_card(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific record card by ID"""
    
    record = db.query(RecordCard).filter(RecordCard.id == record_id).first()
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record card not found"
        )
    
    return APIResponse(
        success=True,
        message="Record card retrieved successfully",
        data={"record": RecordCardResponse.model_validate(record)}
    )


@router.post("", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def create_record_card(
    record_data: RecordCardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new record card (admin/moderator only)"""
    
    # Check permissions (only admin and moderator can create records)
    if current_user.role not in ['admin', 'moderator']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to create record cards"
        )
    
    record = RecordCard(
        title=record_data.title,
        description=record_data.description,
        holder=record_data.holder,
        value=record_data.value,
        unit=record_data.unit,
        category=RecordCategory(record_data.category.value),
        subcategory=record_data.subcategory,
        previous_value=record_data.previous_value,
        previous_holder=record_data.previous_holder,
        date=record_data.date,
        source=record_data.source,
        source_url=record_data.source_url,
        difficulty_tags=record_data.difficulty_tags,
        math_topics=[t.value for t in record_data.math_topics] if record_data.math_topics else [],
        verified=False,
        created_at=None  # Will be set by default
    )
    
    db.add(record)
    db.commit()
    db.refresh(record)
    
    return APIResponse(
        success=True,
        message="Record card created successfully",
        data={"record": RecordCardResponse.model_validate(record)}
    )


@router.put("/{record_id}", response_model=APIResponse)
async def update_record_card(
    record_id: int,
    record_data: RecordCardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing record card"""
    
    # Check permissions
    if current_user.role not in ['admin', 'moderator']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to update record cards"
        )
    
    record = db.query(RecordCard).filter(RecordCard.id == record_id).first()
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record card not found"
        )
    
    # Update fields
    for field, value in record_data.model_dump(exclude_unset=True).items():
        if field == 'category':
            setattr(record, field, RecordCategory(value.value))
        elif field == 'math_topics' and value:
            setattr(record, field, [t.value for t in value])
        else:
            setattr(record, field, value)
    
    db.commit()
    db.refresh(record)
    
    return APIResponse(
        success=True,
        message="Record card updated successfully",
        data={"record": RecordCardResponse.model_validate(record)}
    )


@router.delete("/{record_id}", response_model=APIResponse)
async def delete_record_card(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a record card (admin only)"""
    
    # Check permissions
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete record cards"
        )
    
    record = db.query(RecordCard).filter(RecordCard.id == record_id).first()
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record card not found"
        )
    
    db.delete(record)
    db.commit()
    
    return APIResponse(
        success=True,
        message="Record card deleted successfully"
    )

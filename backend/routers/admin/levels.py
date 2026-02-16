from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.level import Level
from schemas.models import LevelCreate, LevelUpdate, LevelResponse
from auth.dependencies import require_admin

router = APIRouter(prefix="/admin/levels", tags=["Admin - Levels"])


@router.post("", response_model=LevelResponse, dependencies=[Depends(require_admin)])
async def create_level(level_data: LevelCreate, db: Session = Depends(get_db)):
    """Create a new level"""
    new_level = Level(**level_data.dict())
    db.add(new_level)
    db.commit()
    db.refresh(new_level)
    
    return LevelResponse.from_orm(new_level)


@router.get("", response_model=List[LevelResponse])
async def list_levels(db: Session = Depends(get_db)):
    """List all levels (ordered)"""
    levels = db.query(Level).order_by(Level.order).all()
    return [LevelResponse.from_orm(level) for level in levels]


@router.get("/{level_id}", response_model=LevelResponse, dependencies=[Depends(require_admin)])
async def get_level(level_id: str, db: Session = Depends(get_db)):
    """Get level details by ID"""
    level = db.query(Level).filter(Level.id == level_id).first()
    if not level:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Level not found"
        )
    return LevelResponse.from_orm(level)


@router.put("/{level_id}", response_model=LevelResponse, dependencies=[Depends(require_admin)])
async def update_level(level_id: str, level_data: LevelUpdate, db: Session = Depends(get_db)):
    """Update level information"""
    level = db.query(Level).filter(Level.id == level_id).first()
    if not level:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Level not found"
        )
    
    # Update fields
    update_data = level_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(level, field, value)
    
    db.commit()
    db.refresh(level)
    
    return LevelResponse.from_orm(level)


@router.delete("/{level_id}", dependencies=[Depends(require_admin)])
async def delete_level(level_id: str, db: Session = Depends(get_db)):
    """Delete a level"""
    level = db.query(Level).filter(Level.id == level_id).first()
    if not level:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Level not found"
        )
    
    db.delete(level)
    db.commit()
    
    return {"message": "Level deleted successfully"}

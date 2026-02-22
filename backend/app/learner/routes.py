# app/learner/routes.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from jose import JWTError, jwt
from ..config import SECRET_KEY, ALGORITHM
from ..database import get_db
from ..auth.dependencies import oauth2_scheme, get_current_user

router = APIRouter(prefix="/api/learner", tags=["learner"])

@router.get("/profile")
def get_profile(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    query = text("""
        SELECT 
            full_names AS name,
            bokamoso_number,
            grade,
            school,
            email,
            cell_number,
            whatsapp_number,
            enrolled,
            southdeep
        FROM users
        WHERE id = :id
    """)
    result = db.execute(query, {"id": current_user["sub"]}).fetchone()
    
    if not result:
        raise HTTPException(status_code=404, detail="Learner profile not found")
    
    # Convert row to dict using _mapping
    return dict(result._mapping)

@router.get("/assessments")
def get_assessments(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    query = text("""
        SELECT 
            a.name AS assessment_name,
            a.subject,
            a.date_written,
            am.percentage AS mark
        FROM assessments a
        JOIN assessment_marks am ON a.id = am.assessment_id
        WHERE am.learner_id = :id
        ORDER BY a.date_written DESC
    """)
    results = db.execute(query, {"id": current_user["sub"]}).fetchall()
    # Use _mapping for each row
    return [dict(row._mapping) for row in results]

@router.get("/attendance")
def get_attendance(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    query = text("""
        SELECT 
            class_date,
            status,
            apology_message,
            recorded_at
        FROM attendance_classes
        WHERE user_id = :id
        ORDER BY class_date DESC
    """)
    results = db.execute(query, {"id": current_user["sub"]}).fetchall()
    return [dict(row._mapping) for row in results]

@router.get("/notifications")
def get_notifications(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    query = text("""
        SELECT 
            title,
            content,
            is_read,
            created_at
        FROM notifications
        WHERE user_id = :id
        ORDER BY created_at DESC
    """)
    results = db.execute(query, {"id": current_user["sub"]}).fetchall()
    return [dict(row._mapping) for row in results]

@router.get("/applications")
def get_applications(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    query = text("""
        SELECT 
            app_id,
            year,
            status,
            math_type,
            grade,
            created_at,
            updated_at,
            data
        FROM applications
        WHERE user_id = :id
        ORDER BY created_at DESC
    """)
    results = db.execute(query, {"id": current_user["sub"]}).fetchall()
    return [dict(row._mapping) for row in results]
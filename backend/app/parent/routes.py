# app/parent/routes.py
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Body, Form
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text
from jose import JWTError, jwt
from ..config import SECRET_KEY, ALGORITHM, UPLOAD_DIR, BASE_URL
from ..database import get_db
from ..auth.dependencies import oauth2_scheme, get_current_user
import os
import shutil
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Dict, Any, List
import json
import random
import string

router = APIRouter(prefix="/api/parent", tags=["parent"])


# Get child's learner_id (from parents table)
def get_child_learner_id(db: Session, parent_id: int) -> int:
    row = db.execute(text("""
        SELECT user_id FROM parents WHERE id = :pid
    """), {"pid": parent_id}).fetchone()
    if not row:
        raise HTTPException(404, "Parent not found")
    return row.user_id


@router.get("/assessments")
def get_child_assessments(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Parent":
        raise HTTPException(403)
    parent_id = int(current_user["sub"])
    learner_id = get_child_learner_id(db, parent_id)

    query = text("""
        SELECT a.name AS assessment_name, a.subject, a.date_written, am.percentage AS mark
        FROM assessments a
        JOIN assessment_marks am ON a.id = am.assessment_id
        WHERE am.learner_id = :lid
        ORDER BY a.date_written DESC
    """)
    results = db.execute(query, {"lid": learner_id}).fetchall()
    return [dict(row._mapping) for row in results]

@router.get("/attendance")
def get_child_attendance(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Parent":
        raise HTTPException(403)
    parent_id = int(current_user["sub"])
    learner_id = get_child_learner_id(db, parent_id)

    query = text("""
        SELECT class_date, status, apology_message, recorded_at
        FROM attendance_classes
        WHERE user_id = :lid
        ORDER BY class_date DESC
    """)
    results = db.execute(query, {"lid": learner_id}).fetchall()
    return [dict(row._mapping) for row in results]

@router.get("/notifications")
def get_child_notifications(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "Parent":
        raise HTTPException(status_code=403, detail="Only parents can view notifications")

    parent_id = int(current_user["sub"])
    learner_id = get_child_learner_id(db, parent_id)  # your helper function

    # Fetch learner's grade (same as learner endpoint)
    grade_result = db.execute(
        text("SELECT grade FROM users WHERE id = :learner_id"),
        {"learner_id": learner_id}
    ).fetchone()

    if not grade_result:
        raise HTTPException(status_code=404, detail="Child not found")

    user_grade = grade_result[0]

    # Fetch specific notifications for the child
    specific_query = text("""
        SELECT 
            n.id,
            n.title,
            n.content,
            n.created_at,
            n.sender_type,
            n.sender_name
        FROM notifications n
        WHERE n.target_user_id = :learner_id
    """)
    specific_results = db.execute(specific_query, {"learner_id": learner_id}).fetchall()

    # Fetch grade-wide notifications (same as learner)
    grade_query = text("""
        SELECT 
            n.id,
            n.title,
            n.content,
            n.created_at,
            n.sender_type,
            n.sender_name
        FROM notifications n
        WHERE n.target_grade = :grade AND n.target_user_id IS NULL
    """)
    grade_results = db.execute(grade_query, {"grade": user_grade}).fetchall()

    # Combine and sort by created_at DESC
    all_results = specific_results + grade_results
    all_results.sort(key=lambda x: x.created_at, reverse=True)

    # Convert to dicts (no is_read field for parents)
    return [dict(row._mapping) for row in all_results]

@router.get("/warnings")
def get_child_warnings(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Parent":
        raise HTTPException(403)
    parent_id = int(current_user["sub"])
    learner_id = get_child_learner_id(db, parent_id)

    query = text("""
        SELECT id, warning_type AS type, reason, severity, issued_at AS date, status
        FROM learner_warnings
        WHERE learner_id = :lid
        ORDER BY issued_at DESC
    """)
    results = db.execute(query, {"lid": learner_id}).fetchall()
    return [dict(row._mapping) for row in results]

# Apology Model
class ApologyCreate(BaseModel):
    title: str
    message: str
    absence_date: str  # YYYY-MM-DD

@router.post("/apologies")
def submit_apology(
    apology: ApologyCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "Parent":
        raise HTTPException(403)

    parent_id = int(current_user["sub"])
    learner_id = get_child_learner_id(db, parent_id)

    # Validate absence_date
    try:
        datetime.strptime(apology.absence_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(400, "Invalid date format (YYYY-MM-DD)")

    db.execute(text("""
        INSERT INTO apologies (parent_id, learner_id, title, message, absence_date)
        VALUES (:pid, :lid, :title, :message, :absence_date)
    """), {
        "pid": parent_id,
        "lid": learner_id,
        "title": apology.title,
        "message": apology.message,
        "absence_date": apology.absence_date
    })

    db.commit()

    return {"success": True, "message": "Apology submitted successfully"}

@router.get("/apologies")
def get_apology_history(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Parent":
        raise HTTPException(403)

    parent_id = int(current_user["sub"])

    query = text("""
        SELECT id, title, message, absence_date, created_at
        FROM apologies
        WHERE parent_id = :pid
        ORDER BY created_at DESC
    """)
    results = db.execute(query, {"pid": parent_id}).fetchall()
    return [dict(row._mapping) for row in results]


@router.get("/profile")
def get_parent_profile(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Parent":
        raise HTTPException(status_code=403, detail="Only parents can access this profile")

    parent_id = int(current_user["sub"])

    query = text("""
        SELECT 
            p.id AS parent_id,
            CONCAT(p.parent_first_name, ' ', p.parent_surname) AS parent_name,
            p.parent_ref,
            p.parent_email,
            p.parent_cell,
            u.full_names AS child_name,    -- ← Added child's full name
            u.grade,                       -- optional: child's grade
            u.school                       -- optional: child's school
        FROM parents p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = :pid
    """)

    result = db.execute(query, {"pid": parent_id}).fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="Parent profile not found")

    return dict(result._mapping)

@router.get("/assessments")
def get_child_assessments(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Parent":
        raise HTTPException(403)
    parent_id = int(current_user["sub"])
    learner_id = db.execute(text("SELECT user_id FROM parents WHERE id = :pid"), {"pid": parent_id}).fetchone()[0]

    query = text("""
        SELECT a.name AS assessment_name, a.subject, a.date_written, am.percentage AS mark
        FROM assessments a
        JOIN assessment_marks am ON a.id = am.assessment_id
        WHERE am.learner_id = :lid
        ORDER BY a.date_written DESC
    """)
    results = db.execute(query, {"lid": learner_id}).fetchall()
    return [dict(row._mapping) for row in results]

@router.get("/attendance")
def get_child_attendance(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Parent":
        raise HTTPException(403)
    parent_id = int(current_user["sub"])
    learner_id = db.execute(text("SELECT user_id FROM parents WHERE id = :pid"), {"pid": parent_id}).fetchone()[0]

    query = text("""
        SELECT class_date, status, apology_message, recorded_at
        FROM attendance_classes
        WHERE user_id = :lid
        ORDER BY class_date DESC
    """)
    results = db.execute(query, {"lid": learner_id}).fetchall()
    return [dict(row._mapping) for row in results]



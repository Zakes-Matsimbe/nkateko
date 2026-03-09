# app/staff/routes.py
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
from typing import Dict, Any, List, Optional
import json
import random
import string


router = APIRouter(prefix="/api/staff", tags=["staff"])

class SessionReport(BaseModel):
    class_name: str
    session_date: str
    subject: str
    topic: str
    description: str
    positives: Optional[str] = None
    negatives: Optional[str] = None
    comments: Optional[str] = None

class Unavailability(BaseModel):
    date: str
    reason: str

class ClassMessage(BaseModel):
    grade: int
    title: str
    content: str

class AssessmentCapture(BaseModel):
    name: str
    subject: str
    date_written: str
    marks: List[dict]  # [{"learner_id": int, "percentage": float}]

@router.get("/profile")
def get_staff_profile(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    staff_id = int(current_user["sub"])
    query = text("""
        SELECT 
            CONCAT(names, ' ', surname) AS name,
            staff_number,
            role,
            subjects,
            grades,
            email,
            cell
        FROM staff
        WHERE id = :sid
    """)
    result = db.execute(query, {"sid": staff_id}).fetchone()
    if not result:
        raise HTTPException(404)
    return dict(result._mapping)

# Timesheets (monthly)
@router.get("/timesheets")
def get_timesheets(year: int, month: str = "all", db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    staff_id = int(current_user["sub"])
    where = "WHERE staff_id = :sid AND YEAR(attendance_date) = :year"
    params = {"sid": staff_id, "year": year}
    if month != "all":
        where += " AND MONTH(attendance_date) = :month"
        params["month"] = int(month)

    query = text(f"""
        SELECT attendance_date AS date, time_in, time_out,
               TIMESTAMPDIFF(MINUTE, time_in, time_out)/60.0 AS hours,
               status
        FROM staff_time_logs {where}
        ORDER BY attendance_date DESC
    """)
    results = db.execute(query, params).fetchall()
    return [dict(r._mapping) for r in results]

# Submit Session Report
@router.post("/session-report")
def submit_session_report(report: SessionReport, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    staff_id = int(current_user["sub"])
    db.execute(text("""
        INSERT INTO staff_session_reports 
        (staff_id, class_name, session_date, subject, topic, description, positives, negatives, comments)
        VALUES (:sid, :cn, :sd, :sub, :topic, :desc, :pos, :neg, :comm)
    """), {
        "sid": staff_id, "cn": report.class_name, "sd": report.session_date,
        "sub": report.subject, "topic": report.topic, "desc": report.description,
        "pos": report.positives, "neg": report.negatives, "comm": report.comments
    })
    db.commit()
    return {"success": True}

# Submit Unavailability
@router.post("/unavailability")
def submit_unavailability(unavail: Unavailability, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    staff_id = int(current_user["sub"])
    db.execute(text("""
        INSERT INTO staff_availability (staff_id, unavailable_date, reason)
        VALUES (:sid, :date, :reason)
    """), {"sid": staff_id, "date": unavail.date, "reason": unavail.reason})
    db.commit()
    return {"success": True}

# Send Message to Class
@router.post("/messages")
def send_class_message(msg: ClassMessage, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["Teacher", "Tutor"]:
        raise HTTPException(403)
    db.execute(text("""
        INSERT INTO notifications (sender_type, sender_name, target_grade, title, content)
        VALUES ('Staff', :name, :grade, :title, :content)
    """), {"name": current_user["name"], "grade": msg.grade, "title": msg.title, "content": msg.content})
    db.commit()
    return {"success": True}

# Class List
@router.get("/classes")
def get_classes(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    staff_id = int(current_user["sub"])
    grades = db.execute(text("SELECT grades FROM staff WHERE id = :sid"), {"sid": staff_id}).fetchone()[0].split(',')
    classes = []
    for grade in grades:
        learners = db.execute(text("""
            SELECT id, full_names, surname, school
            FROM users
            WHERE grade = :grade AND role = 'Learner'
        """), {"grade": grade}).fetchall()
        classes.append({"grade": grade, "learners": [dict(r._mapping) for r in learners]})
    return classes

# Learner Detail (for modal)
@router.get("/learners/{learner_id}")
def get_learner_detail(learner_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    staff_id = int(current_user["sub"])
    # Check permission (same grade)
    staff_grades = db.execute(text("SELECT grades FROM staff WHERE id = :sid"), {"sid": staff_id}).fetchone()[0].split(',')
    learner_grade = db.execute(text("SELECT grade FROM users WHERE id = :lid"), {"lid": learner_id}).fetchone()[0]
    if str(learner_grade) not in staff_grades:
        raise HTTPException(403)

    learner = db.execute(text("SELECT full_names, surname, school, grade FROM users WHERE id = :lid"), {"lid": learner_id}).fetchone()
    assessments = db.execute(text("""
        SELECT a.name, a.subject, a.date_written, am.percentage
        FROM assessments a JOIN assessment_marks am ON a.id = am.assessment_id
        WHERE am.learner_id = :lid
    """), {"lid": learner_id}).fetchall()
    attendance = db.execute(text("SELECT class_date, status FROM attendance_classes WHERE user_id = :lid"), {"lid": learner_id}).fetchall()

    return {
        "learner": dict(learner._mapping),
        "assessments": [dict(r._mapping) for r in assessments],
        "attendance": [dict(r._mapping) for r in attendance]
    }

# ... more endpoints (capture assessments, user management, etc.)
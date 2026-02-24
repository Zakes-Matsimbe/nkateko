# app/learner/routes.py
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Body
from sqlalchemy.orm import Session
from sqlalchemy import text
from jose import JWTError, jwt
from ..config import SECRET_KEY, ALGORITHM, UPLOAD_DIR
from ..database import get_db
from ..auth.dependencies import oauth2_scheme, get_current_user
import os
import shutil
from datetime import datetime
from pydantic import BaseModel
from typing import Dict, Any
import json
import random
import string

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
            date_submitted,
            data,
            notifications
        FROM applications
        WHERE user_id = :id
        ORDER BY created_at DESC
    """)
    results = db.execute(query, {"id": current_user["sub"]}).fetchall()
    return [dict(row._mapping) for row in results]


    # ------------------- NEW: Check upload status -------------------
@router.get("/check-uploads")
def check_uploads(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user_id = current_user["sub"]

    query = text("""
        SELECT file_type, file_path
        FROM learner_documents
        WHERE user_id = :user_id
        AND file_type IN ('id_copy', 'term4_report')
    """)
    results = db.execute(query, {"user_id": user_id}).fetchall()

    status = {
        "id_uploaded": False,
        "report_uploaded": False,
        "both_uploaded": False,
        "id_url": None,
        "report_url": None
    }

    for row in results:
        if row.file_type == "id_copy":
            status["id_uploaded"] = True
            status["id_url"] = f"/uploads/{row.file_path}"
        if row.file_type == "term4_report":
            status["report_uploaded"] = True
            status["report_url"] = f"/uploads/{row.file_path}"

    status["both_uploaded"] = status["id_uploaded"] and status["report_uploaded"]

    return status


# ------------------- NEW: Upload both documents -------------------
@router.post("/upload-documents")
async def upload_documents(
    id_file: UploadFile = File(...),
    report_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["sub"]

    if not id_file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="ID file must be PDF")
    if not report_file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Report file must be PDF")

    if id_file.size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="ID file too large (max 5MB)")
    if report_file.size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Report file too large (max 5MB)")

    # Create upload dir if missing
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    id_filename = f"{user_id}_id_{timestamp}.pdf"
    report_filename = f"{user_id}_report_{timestamp}.pdf"

    id_path = os.path.join(UPLOAD_DIR, id_filename)
    report_path = os.path.join(UPLOAD_DIR, report_filename)

    # Save files
    with open(id_path, "wb") as f:
        shutil.copyfileobj(id_file.file, f)

    with open(report_path, "wb") as f:
        shutil.copyfileobj(report_file.file, f)

    # Save to DB (upsert - replace if exists)
    for file_type, path in [("id_copy", id_filename), ("term4_report", report_filename)]:
        db.execute(text("""
            INSERT INTO learner_documents (user_id, file_type, file_path, uploaded_at)
            VALUES (:user_id, :file_type, :file_path, NOW())
            ON DUPLICATE KEY UPDATE file_path = :file_path, uploaded_at = NOW()
        """), {
            "user_id": user_id,
            "file_type": file_type,
            "file_path": path
        })

    db.commit()

    return {
        "success": True,
        "message": "Documents uploaded successfully",
        "files": {
            "id": f"/uploads/{id_filename}",
            "report": f"/uploads/{report_filename}"
        }
    }


# Application Creation

@router.post("/applications/create")
def create_application(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["sub"]
    grade = payload.get("grade")
    math_type = payload.get("math_type")
    form_data = payload.get("formData", {})

    if not grade or not math_type or not form_data:
        raise HTTPException(status_code=400, detail="Missing required fields: grade, math_type, formData")

    # Basic validation (can be expanded)
    if math_type != "Mathematics":
        raise HTTPException(status_code=400, detail="Only Pure Mathematics is accepted")

    if grade not in [10, 11, 12]:
        raise HTTPException(status_code=400, detail="Grade must be 10, 11, or 12")

    # Required formData keys (minimal check)
    if "englishLevel" not in form_data or "otherLanguage" not in form_data or "subjects" not in form_data:
        raise HTTPException(status_code=400, detail="Missing required form fields")

    # Ensure subjects is a dict with marks
    subjects = form_data["subjects"]
    if not isinstance(subjects, dict):
        raise HTTPException(status_code=400, detail="Subjects must be an object")

    for sub, marks in subjects.items():
        if not isinstance(marks, dict) or "t2" not in marks or "t4" not in marks:
            raise HTTPException(status_code=400, detail=f"Invalid marks format for subject {sub}")

    # Generate unique app_id: APP-{last 2 digits of year}-{6 random A-Z0-9 chars}

    current_year_short = str(datetime.now().year)[-2:]  # e.g. '26' from 2026
    prefix = f"APP-{current_year_short}"
    chars = string.ascii_uppercase + string.digits  # A-Z0-9

    while True:
        random_part = ''.join(random.choice(chars) for _ in range(6))
        app_id = f"{prefix}-{random_part}"

        # Check if already exists
        check_query = text("SELECT 1 FROM applications WHERE app_id = :app_id LIMIT 1")
        exists = db.execute(check_query, {"app_id": app_id}).fetchone() is not None

        if not exists:
            break


    # Current year
    current_year = datetime.now().year

    # Clean data to store (exactly like your PHP JSON structure)
    clean_data = {
        "englishLevel": form_data.get("englishLevel"),
        "otherLanguage": form_data.get("otherLanguage"),
        "otherLanguageSpecify": form_data.get("otherLanguageSpecify", ""),
        "subjects": subjects,
        "documents": form_data.get("documents", []),
        "electives": form_data.get("electives", [])  # optional
    }

    # Convert to JSON string (matches your DB example)
    data_json = json.dumps(clean_data, ensure_ascii=False)

    # Insert into applications table
    query = text("""
        INSERT INTO applications (
            app_id, user_id, year, status, math_type, grade, data, created_at, updated_at
        ) VALUES (
            :app_id, :user_id, :year, 'Submitted', :math_type, :grade, :data, NOW(), NOW()
        )
    """)

    try:
        db.execute(query, {
            "app_id": app_id,
            "user_id": user_id,
            "year": current_year,
            "math_type": math_type,
            "grade": grade,
            "data": data_json
        })
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    # Format submitted time like your PHP
    submitted_at = datetime.now().strftime("%d %B %Y at %H:%M")

    return {
        "success": True,
        "message": "Application submitted successfully!",
        "app_id": app_id,
        "submitted_at": submitted_at
    }
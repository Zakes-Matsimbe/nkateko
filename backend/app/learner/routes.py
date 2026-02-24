# app/learner/routes.py
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


router = APIRouter(prefix="/api/learner", tags=["learner"])

def get_learner_grade_from_db(
    db: Session,
    current_user: dict
) -> int:
    """
    Fetch learner grade only (no User ORM).
    Fast and safe for reuse.
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    result = db.execute(
        text("SELECT grade FROM users WHERE id = :id"),
        {"id": int(user_id)}
    ).scalar()

    if result is None:
        raise HTTPException(status_code=400, detail="Learner grade not set")

    return int(result)

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
    user_id = current_user["sub"]
    user_grade = db.execute(text("SELECT grade FROM users WHERE id = :user_id"), {"user_id": user_id}).fetchone()[0]

    # Fetch specific notifications for user
    specific_query = text("""
        SELECT 
            n.id, n.title, n.content, n.created_at, 
            COALESCE(nr.is_read, FALSE) as is_read,
            n.sender_type, n.sender_name
        FROM notifications n
        LEFT JOIN notification_reads nr ON n.id = nr.notification_id AND nr.user_id = :user_id
        WHERE n.target_user_id = :user_id
    """)
    specific_results = db.execute(specific_query, {"user_id": user_id}).fetchall()

    # Fetch grade-wide notifications (matching user's grade, optional subject)
    grade_query = text("""
        SELECT 
            n.id, n.title, n.content, n.created_at, 
            COALESCE(nr.is_read, FALSE) as is_read,
            n.sender_type, n.sender_name
        FROM notifications n
        LEFT JOIN notification_reads nr ON n.id = nr.notification_id AND nr.user_id = :user_id
        WHERE n.target_grade = :grade AND n.target_user_id IS NULL
    """)
    grade_results = db.execute(grade_query, {"user_id": user_id, "grade": user_grade}).fetchall()

    # Combine and sort by created_at DESC
    all_results = specific_results + grade_results
    all_results.sort(key=lambda x: x.created_at, reverse=True)

    # Convert to dicts
    return [dict(row._mapping) for row in all_results]

@router.post("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    stmt = text("""
        INSERT INTO notification_reads (notification_id, user_id, is_read, read_at)
        VALUES (:nid, :uid, TRUE, NOW())
        ON DUPLICATE KEY UPDATE
            is_read = TRUE,
            read_at = NOW()
    """)

    db.execute(stmt, {
        "nid": notification_id,
        "uid": current_user["sub"]
    })
    db.commit()

    return {"success": True}

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


def get_learner_subjects(db: Session, user_id: int) -> dict:
    row = db.execute(
        text("""
            SELECT data FROM applications
            WHERE user_id = :uid
            ORDER BY created_at DESC
            LIMIT 1
        """),
        {"uid": user_id}
    ).fetchone()

    if not row or not row.data:
        return {}

    data = json.loads(row.data) if isinstance(row.data, str) else row.data
    return data.get("subjects", {})


def is_term_open(db: Session, term: int) -> bool:
    row = db.execute(
        text("SELECT is_open FROM term_settings WHERE term = :t"),
        {"t": term}
    ).fetchone()

    return bool(row and row.is_open)


def save_report_file(file: UploadFile, user_id: int, term: int) -> str:
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF allowed")

    contents = file.file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(400, "Max file size is 5MB")

    folder = os.path.join(
        UPLOAD_DIR,
        "term_reports",
        f"term{term}"
    )

    os.makedirs(folder, exist_ok=True)

    filename = f"{user_id}_report.pdf"
    path = os.path.join(folder, filename)

    with open(path, "wb") as f:
        f.write(contents)

    # return relative path for DB
    return f"term_reports/term{term}/{filename}"

@router.get("/term-marks/{term}")
def get_term_marks(
    term: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] != "Learner":
        raise HTTPException(403, "Only learners can view term marks")

    user_id = int(current_user["sub"])

    subjects = get_learner_subjects(db, user_id)

    row = db.execute(
        text("""
            SELECT marks, report_path
            FROM learner_term_marks
            WHERE user_id = :uid AND term = :term
        """),
        {"uid": user_id, "term": term}
    ).fetchone()

    report_url = None
    if row and row.report_path:
        # Build full public URL
        report_url = f"{BASE_URL}/uploads/learner_documents/{row.report_path}" if row and row.report_path else None

    return {
        "term": term,
        "is_open": is_term_open(db, term),
        "subjects": subjects,
        "marks": row.marks if row else {},
        "report": report_url
    }


@router.post("/term-marks/{term}")
async def update_term_marks(
    term: int,
    marks: str = Body(..., embed=True),   # frontend sends "marks" as JSON string
    report: UploadFile = File(None),       # optional PDF
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "Learner":
        raise HTTPException(status_code=403, detail="Only learners can update marks")

    user_id = int(current_user["sub"])

    # Term must be open
    if not is_term_open(db, term):
        raise HTTPException(status_code=403, detail="This term is closed for updates")

    # Parse marks JSON
    try:
        marks_dict = json.loads(marks)
        if not isinstance(marks_dict, dict):
            raise ValueError("Marks must be a dictionary")
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(status_code=400, detail=f"Invalid marks format: {str(e)}")

    # Optional: basic mark validation
    for subject, score in marks_dict.items():
        try:
            val = float(score)
            if not (0 <= val <= 100):
                raise ValueError
        except (ValueError, TypeError):
            raise HTTPException(status_code=400, detail=f"Invalid mark for {subject}: must be 0-100")

    # Handle optional report upload
    report_path = None
    if report:
        report_path = save_report_file(report, user_id, term)

    # Upsert into learner_term_marks (insert or update)
    db.execute(text("""
        INSERT INTO learner_term_marks (user_id, term, marks, report_path, updated_at)
        VALUES (:user_id, :term, :marks, :report_path, NOW())
        ON DUPLICATE KEY UPDATE 
            marks = :marks,
            report_path = COALESCE(:report_path, report_path),
            updated_at = NOW()
    """), {
        "user_id": user_id,
        "term": term,
        "marks": json.dumps(marks_dict),
        "report_path": report_path
    })

    db.commit()

    return {
        "success": True,
        "message": "Term marks updated successfully",
        "report_path": report_path
    }

@router.post("/term-marks/{term}/replace-report")
async def replace_term_report(
    term: int,
    report: UploadFile = File(...),  # must provide new file
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "Learner":
        raise HTTPException(403, "Only learners can replace reports")

    user_id = int(current_user["sub"])

    # Term must be open
    if not is_term_open(db, term):
        raise HTTPException(403, "This term is closed for updates")

    # Get current report path (to delete old file)
    current_row = db.execute(
        text("""
            SELECT report_path FROM learner_term_marks 
            WHERE user_id = :uid AND term = :term
        """),
        {"uid": user_id, "term": term}
    ).fetchone()

    old_path = current_row.report_path if current_row else None

    # Save new file
    new_path = save_report_file(report, user_id, term)

    # Delete old file if exists and different
    if old_path and old_path != new_path:
        import os
        full_old_path = os.path.join(UPLOAD_DIR, old_path)
        if os.path.exists(full_old_path):
            try:
                os.remove(full_old_path)
            except Exception as e:
                print(f"Failed to delete old report {old_path}: {e}")

    # Update DB (only report_path)
    db.execute(text("""
        INSERT INTO learner_term_marks (user_id, term, marks, report_path, updated_at)
        VALUES (:user_id, :term, '{}', :report_path, NOW())
        ON DUPLICATE KEY UPDATE 
            report_path = :report_path,
            updated_at = NOW()
    """), {
        "user_id": user_id,
        "term": term,
        "report_path": new_path
    })

    db.commit()

    # Return full public URL
    base_url = "http://localhost:8000"  # ← use your config BASE_URL
    full_url = f"{base_url}/uploads/{new_path}"

    return {
        "success": True,
        "message": "Report replaced successfully",
        "report": full_url
    }


#Reviews
class ReviewCreate(BaseModel):
    staff_id: int = Field(..., gt=0)  # staff.id (teacher/tutor)
    subject: str = Field(..., min_length=1)
    rating: float = Field(..., ge=1, le=5)
    comment: str | None = None

# Check if reviews are open (hardcoded for now, later from DB)
def are_reviews_open(db: Session) -> bool:
    row = db.execute(text("SELECT is_open FROM review_settings WHERE id = 1")).fetchone()
    return row.is_open if row else True  # default open

@router.get("/teacher-review-options")
def get_review_options(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "Learner":
        raise HTTPException(403, "Only learners can access review options")

    # Get active teachers/tutors (role = 'Teacher' or 'Tutor')
    query = text("""
        SELECT 
            id AS staff_id,
            nickname,
            CONCAT(names, ' ', surname) AS full_name,
            subjects,
            role
        FROM staff
        WHERE role IN ('Teacher', 'Tutor')
          AND status = 'Active'
        ORDER BY full_name
    """)
    staff_rows = db.execute(query).fetchall()

    # Parse subjects (handle "Both A and B", comma-separated, etc.)
    teachers = []
    for row in staff_rows:
        subjects_raw = row.subjects or ""
        # Simple split - improve parsing if needed
        subjects_list = [
            s.strip() 
            for s in subjects_raw.replace("Both ", "").replace(" and ", ", ").split(",")
            if s.strip()
        ]
        teachers.append({
            "staff_id": row.staff_id,
            "full_name": f"{row.full_name} ({row.nickname if row.nickname else row.role})",
            "subjects": subjects_list
        })

    return {
        "reviews_open": are_reviews_open(db),
        "teachers": teachers
    }

@router.post("/teacher-reviews")
def submit_review(
    review: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "Learner":
        raise HTTPException(403, "Only learners can submit reviews")

    if not are_reviews_open(db):
        raise HTTPException(403, "Reviews are currently closed")

    learner_id = int(current_user["sub"])

    # Validate staff exists and is teacher/tutor
    staff_check = db.execute(text("""
        SELECT 1 FROM staff 
        WHERE id = :sid AND role IN ('Teacher', 'Tutor') AND status = 'Active'
    """), {"sid": review.staff_id}).fetchone()

    if not staff_check:
        raise HTTPException(400, "Invalid or inactive teacher/tutor")

    # Check if already reviewed this staff + subject
    existing = db.execute(text("""
        SELECT 1 FROM teacher_reviews 
        WHERE learner_id = :lid 
          AND staff_id = :sid 
          AND subject = :subject
    """), {
        "lid": learner_id,
        "sid": review.staff_id,
        "subject": review.subject
    }).fetchone()

    if existing:
        raise HTTPException(400, "You have already reviewed this teacher/tutor for this subject")

    # Insert
    db.execute(text("""
        INSERT INTO teacher_reviews 
        (learner_id, staff_id, subject, rating, comment)
        VALUES (:lid, :sid, :subject, :rating, :comment)
    """), {
        "lid": learner_id,
        "sid": review.staff_id,
        "subject": review.subject,
        "rating": review.rating,
        "comment": review.comment
    })

    db.commit()

    return {"success": True, "message": "Review submitted successfully"}

@router.get("/teacher-reviews")
def get_my_reviews(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "Learner":
        raise HTTPException(403, "Only learners can view their reviews")

    learner_id = int(current_user["sub"])

    query = text("""
        SELECT 
            r.review_id,
            CONCAT(s.names, ' ', s.surname) AS teacher,
            CONCAT(
                s.names, ' ', s.surname,
                ' (',
                COALESCE(NULLIF(s.nickname, ''), s.role),
                ')'
            ) AS display_name,
            r.subject,
            r.rating,
            r.comment,
            r.created_at
        FROM teacher_reviews r
        JOIN staff s ON r.staff_id = s.id
        WHERE r.learner_id = :lid
        ORDER BY r.created_at DESC
    """)

    results = db.execute(query, {"lid": learner_id}).fetchall()

    return [
        {
            "id": row.review_id,
            "teacher": row.display_name,
            "subject": row.subject,
            "rating": float(row.rating),
            "comment": row.comment or "",
            "date": row.created_at.strftime("%Y-%m-%d")
        }
        for row in results
    ]

#wARNINGS

@router.get("/warnings")
def get_learner_warnings(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "Learner":
        raise HTTPException(403, "Only learners can view warnings")

    learner_id = int(current_user["sub"])

    query = text("""
        SELECT 
            id,
            warning_type AS type,
            reason,
            severity,
            issued_at AS date,
            status
        FROM learner_warnings
        WHERE learner_id = :learner_id
          AND status = 'Active'
        ORDER BY issued_at DESC
    """)
    results = db.execute(query, {"learner_id": learner_id}).fetchall()

    warnings = [
        {
            "id": row.id,
            "type": row.type,
            "reason": row.reason,
            "severity": row.severity,
            "date": row.date.strftime("%Y-%m-%d"),
            "status": row.status
        }
        for row in results
    ]

    return warnings

@router.post("/warnings/{warning_id}/acknowledge")
def acknowledge_warning(
    warning_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "Learner":
        raise HTTPException(403)

    learner_id = int(current_user["sub"])

    # Check ownership and active status
    check = db.execute(text("""
        SELECT 1 FROM learner_warnings 
        WHERE id = :wid AND learner_id = :lid AND status = 'Active'
    """), {"wid": warning_id, "lid": learner_id}).fetchone()

    if not check:
        raise HTTPException(404, "Warning not found or already acknowledged")

    db.execute(text("""
        UPDATE learner_warnings 
        SET status = 'Acknowledged', acknowledged_at = NOW()
        WHERE id = :wid
    """), {"wid": warning_id})

    db.commit()

    return {"success": True, "message": "Warning acknowledged"}



# app/staff/routes.py
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Body, Form, Request
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
from utils.send_brevo_email import send_brevo_email


router = APIRouter(prefix="/api/staff", tags=["staff"])

# ── Pydantic Models ────────────────────────────────────────────────────────
class SessionReport(BaseModel):
    class_name: str
    session_date: str
    subject: str
    topic: str
    description: str
    positives: Optional[str] = None
    negatives: Optional[str] = None
    comments: Optional[str] = None

# ── PROFILE ────────────────────────────────────────────────────────────────
@router.get("/profile")
def get_staff_profile(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """
    Get current staff profile (name, role, subjects, grades, etc.)
    """
    if current_user.get("role") not in ["Admin", "Staff"]:
        raise HTTPException(status_code=403, detail="Staff access only")

    staff_id = int(current_user["sub"])

    query = text("""
        SELECT 
            CONCAT(names, ' ', surname) AS name,
            staff_number AS staff_ref,
            role,
            subjects,
            grades,          -- assuming you added this column
            email,
            cell,
            whatsapp,
            hourly_rate
        FROM staff
        WHERE id = :sid AND status = 'Active'
    """)
    result = db.execute(query, {"sid": staff_id}).fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="Staff profile not found or inactive")

    return dict(result._mapping)

# ── TIMESHEETS ─────────────────────────────────────────────────────────────
@router.get("/timesheets")
def get_timesheets(
    year: int,
    month: Optional[str] = "all",
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get staff timesheets for a year/month (or all months)
    Returns list of logs + total hours
    """
    if current_user.get("role") not in ["Admin", "Staff"]:
        raise HTTPException(status_code=403, detail="Staff access only")

    staff_id = int(current_user["sub"])

    where = "WHERE staff_id = :sid AND YEAR(attendance_date) = :year"
    params = {"sid": staff_id, "year": year}

    if month != "all":
        where += " AND MONTH(attendance_date) = :month"
        params["month"] = int(month)

    query = text(f"""
        SELECT 
            id,
            attendance_date AS date,
            TIME(time_in) AS time_in,
            TIME(time_out) AS time_out,
            TIMESTAMPDIFF(MINUTE, time_in, time_out)/60.0 AS hours,
            status,
            disputed
        FROM staff_time_logs {where}
        ORDER BY attendance_date DESC
    """)

    results = db.execute(query, params).fetchall()

    total_hours = sum(row.hours or 0 for row in results)

    return {
        "logs": [dict(row._mapping) for row in results],
        "total_hours": round(total_hours, 2)
    }

# Get previous reports (already have, but confirm)
@router.get("/session-reports")
def get_session_reports(
    year: int = datetime.now().year,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    staff_id = int(current_user["sub"])
    query = text("""
        SELECT id, class_name, session_date, subject, topic, description,
               positives, negatives, comments, created_at
        FROM staff_session_reports
        WHERE staff_id = :sid AND YEAR(session_date) = :year
        ORDER BY session_date DESC
    """)
    results = db.execute(query, {"sid": staff_id, "year": year}).fetchall()
    return [dict(row._mapping) for row in results]

# ── SUBMIT NEW REPORT ──────────────────────────────────────────────────────
@router.post("/session-report")
def submit_session_report(
    report: SessionReport,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    staff_id = int(current_user["sub"])

    db.execute(text("""
        INSERT INTO staff_session_reports 
        (staff_id, class_name, session_date, subject, topic, description, positives, negatives, comments)
        VALUES (:sid, :cn, :sd, :sub, :topic, :desc, :pos, :neg, :comm)
    """), {
        "sid": staff_id,
        "cn": report.class_name,
        "sd": report.session_date,
        "sub": report.subject,
        "topic": report.topic,
        "desc": report.description,
        "pos": report.positives,
        "neg": report.negatives,
        "comm": report.comments
    })
    db.commit()
    return {"success": True}

# ── UPDATE EXISTING REPORT ─────────────────────────────────────────────────
@router.put("/session-reports/{report_id}")
def update_session_report(
    report_id: int,
    report: SessionReport,  # ← now defined above
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    staff_id = int(current_user["sub"])

    # Check ownership
    check = db.execute(text("""
        SELECT session_date FROM staff_session_reports 
        WHERE id = :rid AND staff_id = :sid
    """), {"rid": report_id, "sid": staff_id}).fetchone()

    if not check:
        raise HTTPException(404, "Report not found or not yours")

    # Check age (6 days)
    submitted = datetime.strptime(str(check.session_date), "%Y-%m-%d")
    days_old = (datetime.now() - submitted).days
    if days_old > 6:
        raise HTTPException(403, "Cannot edit reports older than 6 days")

    # Update
    db.execute(text("""
        UPDATE staff_session_reports SET
            class_name = :cn,
            session_date = :sd,
            subject = :sub,
            topic = :topic,
            description = :desc,
            positives = :pos,
            negatives = :neg,
            comments = :comm
        WHERE id = :rid AND staff_id = :sid
    """), {
        "cn": report.class_name,
        "sd": report.session_date,
        "sub": report.subject,
        "topic": report.topic,
        "desc": report.description,
        "pos": report.positives,
        "neg": report.negatives,
        "comm": report.comments,
        "rid": report_id,
        "sid": staff_id
    })
    db.commit()

    return {"success": True, "message": "Report updated"}


# Get previous unavailability (current year)
@router.get("/unavailability")
def get_unavailability(
    year: int = datetime.now().year,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    staff_id = int(current_user["sub"])

    query = text("""
        SELECT id, unavailable_date, reason, created_at
        FROM staff_availability
        WHERE staff_id = :sid AND YEAR(unavailable_date) = :year
        ORDER BY unavailable_date DESC
    """)
    results = db.execute(query, {"sid": staff_id, "year": year}).fetchall()

    return [dict(row._mapping) for row in results]


# Submit new unavailability (already have, but confirm)
@router.post("/unavailability")
async def submit_unavailability(
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    staff_id = int(current_user["sub"])
    data = await request.json()

    unavailable_date_str = data.get("date")
    reason = data.get("reason")

    if not unavailable_date_str or not reason:
        raise HTTPException(status_code=422, detail="Missing required fields: date and reason")

    try:
        unavailable_date = datetime.strptime(unavailable_date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid date format. Use YYYY-MM-DD")

    # Now compare dates correctly
    if unavailable_date < datetime.now().date():
        raise HTTPException(status_code=400, detail="Unavailability date must be in the future")

    db.execute(text("""
        INSERT INTO staff_availability (staff_id, unavailable_date, reason)
        VALUES (:sid, :date, :reason)
    """), {
        "sid": staff_id,
        "date": unavailable_date_str,  # still insert as string or date
        "reason": reason.strip()
    })
    db.commit()

    return {"success": True, "message": "Unavailability request submitted"}


# Get learners for a grade (staff must be assigned to that grade)
# app/staff/routes.py
@router.get("/learners")
def get_learners_for_grade(
    grade: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    staff_id = int(current_user["sub"])

    # Optional: check staff is assigned to this grade (if you want to keep permission check)
    staff_grades = db.execute(text("""
        SELECT grades FROM staff WHERE id = :sid
    """), {"sid": staff_id}).fetchone()[0]

    if not staff_grades or (staff_grades != 'all' and str(grade) not in staff_grades.split(',')):
        raise HTTPException(403, "You are not assigned to this grade")

    # Exact same logic as your PHP code
    query = text("""
        SELECT u.id, u.full_names, u.school, u.email
        FROM applications a
        JOIN users u ON u.id = a.user_id
        WHERE a.status = 'Accepted'
          AND a.Decision_mail = 'Yes'
          AND a.first_mail = 'Yes'
          AND a.grade = :grade
        ORDER BY u.full_names
    """)
    learners = db.execute(query, {"grade": grade}).fetchall()

    return [dict(row._mapping) for row in learners]

@router.get("/assessments/check")
def check_assessment_duplicate(
    name: str,
    grade: int,
    subject: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    staff_id = int(current_user["sub"])

    # Optional: check staff assigned to grade/subject

    query = text("""
        SELECT 1 FROM assessments
        WHERE name = :name AND grade = :grade AND subject = :subject
        LIMIT 1
    """)
    exists = db.execute(query, {"name": name.strip(), "grade": grade, "subject": subject.strip()}).fetchone() is not None

    return {"exists": exists}

# Capture assessment + marks
@router.post("/assessments")
async def capture_assessments(
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    staff_id = int(current_user["sub"])
    data = await request.json()

    required = ["name", "subject", "date_written", "grade", "total_mark", "marks"]
    missing = [f for f in required if f not in data]
    if missing:
        raise HTTPException(422, f"Missing fields: {', '.join(missing)}")

    name = data["name"].strip()
    subject = data["subject"].strip()
    date_written = data["date_written"]
    grade = int(data["grade"])
    total_mark = int(data["total_mark"])
    marks = data["marks"]  # list of {learner_id: int, percentage: float}

    if not marks or not isinstance(marks, list):
        raise HTTPException(422, "Marks must be a non-empty list")

    # Start transaction
    try:
        db.begin()

        # Insert assessment
        db.execute(text("""
            INSERT INTO assessments (name, grade, subject, total_mark, date_written, created_by)
            VALUES (:name, :grade, :subject, :total, :date, :sid)
        """), {
            "name": name,
            "grade": grade,
            "subject": subject,
            "total": total_mark,
            "date": date_written,
            "sid": staff_id
        })
        assessment_id = db.execute(text("SELECT LAST_INSERT_ID()")).fetchone()[0]

        total_percent = 0
        count = 0

        for mark in marks:
            learner_id = int(mark["learner_id"])
            percentage = float(mark["percentage"])

            # Validate learner belongs to grade
            learner_check = db.execute(text("""
                SELECT 1 FROM users WHERE id = :lid AND grade = :grade
            """), {"lid": learner_id, "grade": grade}).fetchone()
            if not learner_check:
                raise HTTPException(403, f"Learner {learner_id} not in grade {grade}")

            db.execute(text("""
                INSERT INTO assessment_marks (assessment_id, learner_id, percentage)
                VALUES (:aid, :lid, :perc)
            """), {"aid": assessment_id, "lid": learner_id, "perc": percentage})

            total_percent += percentage
            count += 1

        average = total_percent / count if count > 0 else 0

        db.execute(text("""
            UPDATE assessments SET average = :avg WHERE id = :aid
        """), {"avg": average, "aid": assessment_id})

        db.commit()
        return {"success": True, "message": "Assessment captured"}

    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error saving assessment: {str(e)}")


@router.get("/assessments/results")
def get_assessment_results(
    grade: int,
    month: int,
    subject: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    staff_id = int(current_user["sub"])

    # Optional: check staff assigned to grade/subject
    staff_grades = db.execute(text("SELECT grades FROM staff WHERE id = :sid"), {"sid": staff_id}).fetchone()[0]
    if not staff_grades or (staff_grades != 'all' and str(grade) not in staff_grades.split(',')):
        raise HTTPException(403, "Not assigned to this grade")

    # 1. Get all assessments for filters
    assess_query = text("""
        SELECT id, name, date_written, average
        FROM assessments
        WHERE grade = :grade
          AND subject = :subject
          AND MONTH(date_written) = :month
        ORDER BY date_written ASC
    """)
    assessments = db.execute(assess_query, {"grade": grade, "subject": subject.strip(), "month": month}).fetchall()
    assess_list = [dict(row._mapping) for row in assessments]

    if not assess_list:
        return []

    # 2. Get accepted learners
    learner_query = text("""
        SELECT u.id, u.full_names, u.school
        FROM applications a
        JOIN users u ON u.id = a.user_id
        WHERE a.status = 'Accepted'
          AND a.Decision_mail = 'Yes'
          AND a.first_mail = 'Yes'
          AND a.grade = :grade
        ORDER BY u.full_names ASC
    """)
    learners = db.execute(learner_query, {"grade": grade}).fetchall()
    learner_list = [dict(row._mapping) for row in learners]

    # 3. Build results per learner
    results = []
    for learner in learner_list:
        learner_marks = []
        total = 0
        count = 0

        for assess in assess_list:
            mark_query = text("""
                SELECT percentage
                FROM assessment_marks
                WHERE assessment_id = :aid AND learner_id = :lid
            """)
            mark = db.execute(mark_query, {"aid": assess["id"], "lid": learner["id"]}).fetchone()
            percentage = mark[0] if mark else None

            learner_marks.append({
                "name": assess["name"],
                "average": assess["average"],
                "percentage": percentage
            })

            if percentage is not None:
                total += percentage
                count += 1

        monthly_avg = round(total / count, 1) if count > 0 else 0

        results.append({
            "id": learner["id"],
            "full_names": learner["full_names"],
            "school": learner["school"] or "N/A",
            "monthly_average": monthly_avg,
            "assessments": learner_marks
        })

    # Sort by monthly_average DESC
    results.sort(key=lambda x: x["monthly_average"], reverse=True)

    return results


@router.get("/learners/{learner_id}")
def get_learner_detail(
    learner_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    staff_id = int(current_user["sub"])

    # Permission check (staff assigned to learner's grade)
    staff_grades = db.execute(text("SELECT grades FROM staff WHERE id = :sid"), {"sid": staff_id}).fetchone()[0]
    learner_grade = db.execute(text("SELECT grade FROM users WHERE id = :lid"), {"lid": learner_id}).fetchone()[0]

    if not learner_grade or (staff_grades != 'all' and str(learner_grade) not in staff_grades.split(',')):
        raise HTTPException(403, "Not authorized to view this learner")

    learner = db.execute(text("""
        SELECT id, full_names, surname, school, grade
        FROM users
        WHERE id = :lid
    """), {"lid": learner_id}).fetchone()

    if not learner:
        raise HTTPException(404, "Learner not found")

    # Attendance (current year)
    attendance = db.execute(text("""
        SELECT class_date, status, apology_message
        FROM attendance_classes
        WHERE user_id = :lid AND YEAR(class_date) = YEAR(CURDATE())
        ORDER BY class_date DESC
    """), {"lid": learner_id}).fetchall()

    # Assessments (current year)
    assessments = db.execute(text("""
        SELECT a.name, a.subject, a.date_written, am.percentage
        FROM assessments a
        JOIN assessment_marks am ON a.id = am.assessment_id
        WHERE am.learner_id = :lid AND YEAR(a.date_written) = YEAR(CURDATE())
        ORDER BY a.date_written DESC
    """), {"lid": learner_id}).fetchall()

    return {
        "learner": dict(learner._mapping),
        "attendance": [dict(row._mapping) for row in attendance],
        "assessments": [dict(row._mapping) for row in assessments]
    }


@router.post("/attendance/capture")
async def capture_attendance(
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    staff_id = int(current_user["sub"])
    data = await request.json()

    grade = data["grade"]
    class_date = data["class_date"]
    attendance_list = data["attendance"]  # list of {learner_id, status, apology?}

    if not grade or not class_date or not attendance_list:
        raise HTTPException(422, "Missing required fields")

    # Lock future dates
    if class_date > datetime.now().date().isoformat():
        raise HTTPException(403, "Cannot capture attendance for future dates")

    db.begin()
    try:
        for item in attendance_list:
            learner_id = int(item["learner_id"])
            status = item["status"]
            apology = item.get("apology", None) if status == "Apology" else None

            db.execute(text("""
                INSERT INTO attendance_classes 
                (user_id, grade, class_date, status, apology_message, recorded_at, recorded_by)
                VALUES (:lid, :grade, :date, :status, :apology, NOW(), :by)
                ON DUPLICATE KEY UPDATE
                    status = :status,
                    apology_message = :apology,
                    recorded_at = NOW(),
                    recorded_by = :by
            """), {
                "lid": learner_id,
                "grade": grade,
                "date": class_date,
                "status": status,
                "apology": apology,
                "by": current_user.get("name", "System")
            })

        db.commit()
        return {"success": True}
    except Exception as e:
        db.rollback()
        raise HTTPException(500, str(e))


@router.post("/messages")
async def send_class_message(
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    data = await request.json()

    grades = data["grades"]
    title = data["title"].strip()
    content = data["content"].strip()

    staff_id = int(current_user["sub"])

    staff_query = text("""
        SELECT role,
               CONCAT(names,' ',surname) AS name,
               grades
        FROM staff
        WHERE id = :sid
    """)

    staff = db.execute(staff_query, {"sid": staff_id}).fetchone()

    if not staff:
        raise HTTPException(403, "Staff account not found")

    sender_role = staff.role
    sender_name = staff.name

    allowed_roles = ['Admin','Teacher','Tutor']

    if sender_role not in allowed_roles:
        raise HTTPException(403, "Not allowed")

    # staff assigned grades
    if staff.grades.lower() == "all":
        allowed_grades = ["10","11","12"]
    else:
        allowed_grades = [g.strip() for g in staff.grades.split(",")]

    # Validate selected grades
    for g in grades:
        if g not in allowed_grades:
            raise HTTPException(403, f"You cannot send to grade {g}")

    grade_string = ",".join(grades)

    db.execute(text("""
        INSERT INTO notifications
        (title,content,sender_name,sender_type,target_grades)
        VALUES (:title,:content,:sender_name,:sender_type,:grades)
    """),{
        "title":title,
        "content":content,
        "sender_name":sender_name,
        "sender_type":sender_role,
        "grades":grade_string
    })

    db.commit()

    return {"success":True}


@router.get("/notifications")
def get_class_notifications(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    staff_id = int(current_user["sub"])

    # Get staff name from DB
    staff = db.execute(text("""
        SELECT CONCAT(names,' ',surname) AS name
        FROM staff
        WHERE id = :sid
    """), {"sid": staff_id}).fetchone()

    if not staff:
        raise HTTPException(status_code=404, detail="Staff account not found")

    sender_name = staff.name

    # Fetch notifications sent by this staff member
    rows = db.execute(text("""
        SELECT
            id,
            title,
            content,
            target_grades,
            created_at
        FROM notifications
        WHERE sender_name = :sender_name
        ORDER BY created_at DESC
    """), {"sender_name": sender_name}).fetchall()

    return [dict(r._mapping) for r in rows]


# ── NOTIFICATIONS ──────────────────────────────────────────────────────────
@router.get("/staffnotifications")
def get_staff_notifications(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get latest staff notifications
    """
    staff_id = int(current_user["sub"])

    query = text("""
        SELECT 
            id,
            title,
            content,
            created_at,
            is_read
        FROM staff_notifications  -- assume this table exists
        WHERE staff_id = :sid
        ORDER BY created_at DESC
        LIMIT :limit
    """)
    results = db.execute(query, {"sid": staff_id, "limit": limit}).fetchall()

    return [dict(row._mapping) for row in results]


@router.patch("/staffnotifications/{nid}/read")
def mark_notification_read(
    nid: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    staff_id = int(current_user["sub"])

    db.execute(text("""
        UPDATE staff_notifications
        SET is_read = 1
        WHERE id = :nid AND staff_id = :sid
    """), {"nid": nid, "sid": staff_id})

    db.commit()

    return {"success": True}


class EmailRequest(BaseModel):
    to: str
    subject: str
    html: str


@router.post("/send-email")
def send_email(
    payload: EmailRequest,
    current_user: dict = Depends(get_current_user)
):

    success = send_brevo_email(
        payload.to,
        payload.subject,
        payload.html,
        name=current_user.get("name",""),
        reference=current_user.get("sub","")
    )

    if not success:
        raise HTTPException(status_code=500, detail="Email failed")

    return {"message": "Email sent successfully"}
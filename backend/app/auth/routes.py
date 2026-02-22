from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text, table
from ..database import get_db
from ..auth.utils import verify_password, create_access_token

router = APIRouter(prefix="/api", tags=["auth"])

class LoginRequest(BaseModel):
    identifier: str
    password: str
    detected_role: str | None = None

@router.post("/login")
def login(
    data: LoginRequest,
    db: Session = Depends(get_db)
):
    identifier = data.identifier.strip()
    password = data.password

    upper_id = identifier.upper()
    query = None
    name_field = "name"
    password_field = "password_hash"
    role_value_field = "role_id"

    if upper_id.startswith('ADM'):
        query = text("""
            SELECT id, name, password_hash, role_id 
            FROM admins 
            WHERE admin_number = :id OR email = :id
        """)
        name_field = "name"

    elif upper_id.startswith('BET'):
        query = text("""
            SELECT id, names AS name, password, role 
            FROM staff 
            WHERE staff_number = :id OR email = :id
        """)
        password_field = "password"  # staff uses 'password'
        role_value_field = "role"   # string enum

    elif upper_id.startswith('BOK'):
        query = text("""
            SELECT id, full_names AS name, password_hash, role_id 
            FROM users 
            WHERE bokamoso_number = :id OR email = :id
        """)
        name_field = "full_names"

    else:
        raise HTTPException(status_code=400, detail="Invalid identifier format")

    result = db.execute(query, {"id": identifier}).fetchone()

    if not result:
        raise HTTPException(status_code=401, detail="Invalid reference number or email")

    user_id, name, hashed_password, role_value = result

    if not verify_password(password, hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect password")

    # Get role
    if role_value_field == "role":
        role = role_value  # staff: string
    else:
        role_result = db.execute(
            text("SELECT name FROM roles WHERE id = :id"),
            {"id": role_value}
        ).fetchone()
        role = role_result[0] if role_result else "Unknown"

    access_token = create_access_token(data={"sub": str(user_id), "role": role})

    return {
        "user": {"id": user_id, "name": name, "role": role, "grade": grade if table == 'users' else None, "school": school if table == 'users' else None},
        "token": access_token
    }
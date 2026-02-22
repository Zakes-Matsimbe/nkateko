# app/database.py
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from .config import DATABASE_URL

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Test connection on import (runs when file is loaded)
try:
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("Database connection OK")
except Exception as e:
    print(f"Database connection FAILED: {e}")
# app/parent.py
import datetime
import random
import string
import os
from sqlalchemy import create_engine, text
from urllib.parse import quote_plus
from dotenv import load_dotenv

# Load .env
load_dotenv()

# Database config (same as your main app)
DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = quote_plus(os.getenv("DB_PASSWORD"))
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT", "3306")

DATABASE_URL = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}"
    f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# Connect to DB
engine = create_engine(DATABASE_URL)

# Your provided Bcrypt hash for "asdfghjkl"
HASHED_PASSWORD = '$2a$12$WDH0MfAwgYD.EQYj3Ne4JeUXAzmKhQjMXTtUm2.pqRh/DpnqKphYu'

def generate_parent_ref():
    current_year_short = str(datetime.datetime.now().year)[-2:]  # e.g. '26'
    chars = string.ascii_uppercase + string.digits
    random_part = ''.join(random.choice(chars) for _ in range(5))
    return f"PAR{current_year_short}{random_part}"

# Step 1: Fetch parent IDs that need updating
parent_ids = []
with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT id FROM parents 
        WHERE parent_ref IS NULL OR password IS NULL
    """))
    parent_ids = [row[0] for row in result.fetchall()]

if not parent_ids:
    print("No parents need updating (all have parent_ref and password).")
    exit()

print(f"Found {len(parent_ids)} parents to update:")

# Step 2: Generate & execute UPDATEs in separate connections
updated = []
for parent_id in parent_ids:
    ref = generate_parent_ref()
    sql = text("""
        UPDATE parents 
        SET parent_ref = :ref, 
            password = :pw
        WHERE id = :id
    """)

    with engine.connect() as conn:
        conn.execute(sql, {"ref": ref, "pw": HASHED_PASSWORD, "id": parent_id})
        conn.commit()

    updated.append((parent_id, ref))
    print(f"Updated parent ID {parent_id} → parent_ref = {ref}")

print("\nAll done!")
print(f"Updated {len(updated)} parents.")
print("You can now login with:")
print(" - Username = parent_ref (e.g. PAR26K7M9P)")
print(" - Password = asdfghjkl")
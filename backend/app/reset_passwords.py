# app/reset_passwords.py
from sqlalchemy import create_engine, text
from passlib.context import CryptContext
from dotenv import load_dotenv
from urllib.parse import quote_plus
import os

# Load .env
load_dotenv()

# Database config from .env (same as main.py)
DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = quote_plus(os.getenv("DB_PASSWORD"))
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT", "3306")

DATABASE_URL = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}"
    f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)


HASHED_PASSWORD = '$2a$12$WDH0MfAwgYD.EQYj3Ne4JeUXAzmKhQjMXTtUm2.pqRh/DpnqKphYu'

def reset_all_passwords():
    print("=== SAFE PASSWORD RESET ===")
    engine = create_engine(DATABASE_URL)

    # ✅ begin() auto-commits if no error
    with engine.begin() as conn:

        r_admins = conn.execute(
            text("UPDATE admins SET password_hash = :h"),
            {"h": HASHED_PASSWORD}
        )
        print(f"Admins updated: {r_admins.rowcount}")

        r_staff = conn.execute(
            text("UPDATE staff SET password = :h"),
            {"h": HASHED_PASSWORD}
        )
        print(f"Staff updated: {r_staff.rowcount}")

        r_users = conn.execute(
            text("UPDATE users SET password_hash = :h"),
            {"h": HASHED_PASSWORD}
        )
        print(f"Users updated: {r_users.rowcount}")

    print("\n✅ Reset complete. Password = asdfghjkl")

if __name__ == "__main__":
    reset_all_passwords()
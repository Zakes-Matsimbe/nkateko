# app/config.py
from dotenv import load_dotenv
from urllib.parse import quote_plus
import os


# Load .env
load_dotenv()

# Database config from .env 
DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = quote_plus(os.getenv("DB_PASSWORD"))
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT", "3306")

DATABASE_URL = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}"
    f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)
UPLOAD_DIR = "uploads/learner_documents"  # relative to project root

# JWT
SECRET_KEY = os.getenv("SECRET_KEY", "change-this-in-production-to-a-very-long-random-string")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # ---------------- Database ----------------
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ---------------- Frontend Public URL ----------------
    # Required for email activation and CORS
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://44.211.36.186")

    # ---------------- Email ----------------
    EMAIL_CONFIG = {
        'sender_email': os.getenv('SMTP_USER'),
        'sender_password': os.getenv('SMTP_PASSWORD'),
        'smtp_server': os.getenv('SMTP_HOST'),
        'smtp_port': int(os.getenv('SMTP_PORT', 587)),
    }

    # Used by Contractor + Provider Sign-Up confirmation
    FROM_EMAIL = os.getenv("FROM_EMAIL")

    # ---------------- CORS ----------------
    ALLOWED_ORIGINS = [
        "*",                  # Allow all (optional, but useful for production debugging)
        FRONTEND_URL          # Allow only your deployed app URL
    ]

    # ---------------- Encryption ----------------
    ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")

    # ---------------- Uploads ----------------
    UPLOAD_FOLDER = "uploads"


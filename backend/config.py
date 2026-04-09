import os
import sys

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://bursary:bursary@localhost:5432/bursary_db")

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7
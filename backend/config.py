import os
from pathlib import Path

from dotenv import load_dotenv

# Load from backend/.env or project root .env
root = Path(__file__).resolve().parent
load_dotenv(root / ".env")
load_dotenv(root.parent / ".env")

MONGODB_URI = os.getenv("MONGODB_URI", "")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")

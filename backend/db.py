import certifi
from pymongo import MongoClient

from config import MONGODB_URI, MONGODB_DB_NAME

_client = None
_db = None


def get_db():
    global _client, _db
    if _db is not None:
        return _db
    if not MONGODB_URI:
        raise ValueError("MONGODB_URI is not set. Add it to backend/.env")
    _client = MongoClient(
        MONGODB_URI,
        tls=True,
        tlsCAFile=certifi.where(),
    )
    _db = _client[MONGODB_DB_NAME]
    print(f"[MongoDB] Using database: {MONGODB_DB_NAME}")
    _client.admin.command("ping")
    print("[MongoDB] Connection ping succeeded.")
    return _db


def get_profiles():
    return get_db()["profiles"]


def get_concept_logs():
    return get_db()["concept_logs"]

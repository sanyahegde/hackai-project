from pymongo import MongoClient

from config import MONGODB_URI

_client = None
_db = None


def get_db():
    global _client, _db
    if _db is not None:
        return _db
    if not MONGODB_URI:
        raise ValueError("MONGODB_URI is not set. Add it to backend/.env")
    _client = MongoClient(MONGODB_URI)
    _db = _client.get_default_database()
    if _db is None:
        _db = _client["learnflow"]
    return _db


def get_learning_history():
    return get_db()["learning_history"]


def get_watched_videos():
    return get_db()["watched_videos"]

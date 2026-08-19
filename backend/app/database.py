from pymongo import MongoClient
from app.config import settings

client = MongoClient(settings.mongodb_uri)
db = client["suraksha"]

def get_db():
    yield db

def create_indexes():
    # Ensure unique index on scan_id
    db.scan_history.create_index("scan_id", unique=True)
    db.listings.create_index("url", unique=True)
    db.field_checks.create_index([("listing_id", 1), ("field_name", 1)], unique=True)

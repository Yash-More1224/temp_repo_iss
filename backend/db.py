from motor.motor_asyncio import AsyncIOMotorClient
import os
from fastapi import HTTPException # BUGFIX: Import HTTPException

# BUGFIX: Use environment variable for database name as well
MONGO_URI = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB_NAME", "testdb") # BUGFIX: Added DB name env var with default

# BUGFIX: Consider making client a singleton or managing connection pool
# For simplicity here, we re-initialize on each call, which is inefficient.
# A better approach involves app state or a dependency injection container.

def init_db():
    # BUGFIX: Add error handling for database connection
    try:
        client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000) # Add timeout
        # The ismaster command is cheap and does not require auth.
        client.admin.command('ismaster') # Check connection
        print(f"Successfully connected to MongoDB at {MONGO_URI}") # Log success
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}") # Log error
        # Depending on the application, you might want to raise the exception
        # or handle it differently (e.g., return None or default values)
        raise HTTPException(status_code=500, detail="Database connection failed")

    # BUGFIX: Use the DB_NAME variable
    db = client[DB_NAME]
    return {
        # BUGFIX: Use consistent collection names (e.g., plural)
        "items_collection": db["items"],
        "users_collection": db["users"]
        # Add other collections here if needed (e.g., quiz_attempts)
    }

# BUGFIX: Removed irrelevant comment
# # Question for chocolate: How can we implement nosql syntax in mysql ???
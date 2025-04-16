from fastapi import APIRouter, HTTPException, Depends, status
from models import User, UserCreate, UserInDB
from security import get_password_hash, verify_password, create_access_token, get_current_user, oauth2_scheme
from fastapi.security import OAuth2PasswordRequestForm
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from db import init_db
from datetime import timedelta

router = APIRouter()

async def get_users_collection():
    db_connections = init_db()
    return db_connections["users_collection"]

@router.get("/", response_model=list[User])
async def get_users(collection: AsyncIOMotorClient = Depends(get_users_collection),
                    current_user: User = Depends(get_current_user)):
    users = []
    async for user_doc in collection.find():
        users.append(User(**user_doc))
    return users

@router.post("/register", response_model=User)
async def create_user(user_data: UserCreate, collection: AsyncIOMotorClient = Depends(get_users_collection)):
    existing_user = await collection.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    existing_email = await collection.find_one({"email": user_data.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user_data.password)
    user_in_db = UserInDB(**user_data.dict(exclude={"password"}), hashed_password=hashed_password)

    result = await collection.insert_one(user_in_db.dict())
    created_user = await collection.find_one({"_id": result.inserted_id})

    return User(**created_user)

@router.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), collection: AsyncIOMotorClient = Depends(get_users_collection)):
    user = await collection.find_one({"username": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=User)
async def read_users_me(current_user_data: dict = Depends(get_current_user), collection: AsyncIOMotorClient = Depends(get_users_collection)):
    username = current_user_data.username
    user = await collection.find_one({"username": username})
    if user:
        return User(**user)
    raise HTTPException(status_code=404, detail="User not found")

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str, collection: AsyncIOMotorClient = Depends(get_users_collection),
                      current_user: User = Depends(get_current_user)):
    try:
        obj_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    result = await collection.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
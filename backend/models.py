from pydantic import BaseModel, Field, EmailStr
from typing import Optional

class Item(BaseModel):
    name: str
    description: Optional[str] = None

class User(BaseModel):
    username: str
    email: EmailStr

class UserCreate(User):
    password: str

class UserInDB(User):
    hashed_password: str
from fastapi import APIRouter, HTTPException, Depends, status
from models import Item, User
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from db import init_db
from security import get_current_user

router = APIRouter()

async def get_items_collection():
    db_connections = init_db()
    return db_connections["items_collection"]

@router.get("/", response_model=list[Item])
async def get_items(collection: AsyncIOMotorClient = Depends(get_items_collection),
                    current_user: User = Depends(get_current_user)):
    items = []
    async for item_doc in collection.find():
        item_doc["_id"] = str(item_doc["_id"])
        items.append(Item(**item_doc))
    return items

@router.post("/", response_model=Item, status_code=status.HTTP_201_CREATED)
async def create_item(item: Item, collection: AsyncIOMotorClient = Depends(get_items_collection),
                      current_user: User = Depends(get_current_user)):
    item_dict = item.dict()
    result = await collection.insert_one(item_dict)
    created_item = await collection.find_one({"_id": result.inserted_id})
    return Item(**created_item)

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: str, collection: AsyncIOMotorClient = Depends(get_items_collection),
                      current_user: User = Depends(get_current_user)):
    try:
        obj_id = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid item ID format")

    result = await collection.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
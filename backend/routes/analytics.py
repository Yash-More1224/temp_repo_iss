from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
import numpy as np
import matplotlib.pyplot as plt
import io
import base64
from motor.motor_asyncio import AsyncIOMotorClient
from db import init_db
from security import get_current_user
from models import User

router = APIRouter()

async def get_items_collection():
    db_connections = init_db()
    return db_connections["items_collection"]

async def get_users_collection():
    db_connections = init_db()
    return db_connections["users_collection"]

@router.get("/", response_class=JSONResponse)
async def get_analytics(items_collection: AsyncIOMotorClient = Depends(get_items_collection),
                        users_collection: AsyncIOMotorClient = Depends(get_users_collection),
                        current_user: User = Depends(get_current_user)):

    items = []
    async for item in items_collection.find():
        items.append(item)

    users = []
    async for user in users_collection.find():
        if 'username' in user:
            users.append(user)

    item_count = len(items)
    user_count = len(users)

    item_name_lengths = np.array([len(item['name']) for item in items if 'name' in item and isinstance(item['name'], str)])
    user_username_lengths = np.array([len(user['username']) for user in users if 'username' in user and isinstance(user['username'], str)])

    stats = {
        "item_count": item_count,
        "user_count": user_count,
        "avg_item_name_length": float(np.mean(item_name_lengths)) if item_name_lengths.size > 0 else 0.0,
        "avg_user_username_length": float(np.mean(user_username_lengths)) if user_username_lengths.size > 0 else 0.0,
        "max_item_name_length": int(np.max(item_name_lengths)) if item_name_lengths.size > 0 else 0,
        "max_user_username_length": int(np.max(user_username_lengths)) if user_username_lengths.size > 0 else 0,
    }

    plt.switch_backend('Agg')

    plt.figure(figsize=(8, 6))

    if item_name_lengths.size > 0:
        plt.hist(item_name_lengths, bins=10, alpha=0.5, label="Item Names", color="blue")
    if user_username_lengths.size > 0:
        plt.hist(user_username_lengths, bins=10, alpha=0.5, label="Usernames", color="green")

    if item_name_lengths.size > 0 or user_username_lengths.size > 0:
        plt.legend()
    else:
        plt.text(0.5, 0.5, 'No data available for plot', horizontalalignment='center', verticalalignment='center')

    plt.title("Distribution of Name Lengths")
    plt.xlabel("Length")
    plt.ylabel("Frequency")

    buffer = io.BytesIO()
    plt.savefig(buffer, format="png")
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    plt.close()

    return JSONResponse({
        "stats": stats,
        "plot_image": f"data:image/png;base64,{image_base64}"
    })
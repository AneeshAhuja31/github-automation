from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
from auth.schemas import UserInfo
from dotenv import load_dotenv
load_dotenv(override=True)

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DATABASE_NAME = os.getenv("MONGODB_DATABASE_NAME")

client = AsyncIOMotorClient(MONGODB_URI)
db = client[f"{MONGODB_DATABASE_NAME}"]
user_collection = db["users"]

async def create_or_update_user(user_data:UserInfo):
    username = user_data.username

    filter_query = {"username":username}
    user_data_upserted = {
        "username":username,
        "name":user_data.name,
        "updatedAt":datetime.utcnow(),
        "is_active":True
    }
    update_query = {
        "$set": user_data_upserted,
        "$setOnInsert":{
            "createdAt":datetime.utcnow()
        }
    }
    result = await user_collection.update_one(filter_query,update_query,upsert=True)
    if result.upserted_id:
        return {"upserted":True}
    return {"upserted":False}
    

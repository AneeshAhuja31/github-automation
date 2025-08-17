from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
from auth.schemas import UserInfo,UserGithubInfo
from dotenv import load_dotenv
load_dotenv(override=True)

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DATABASE_NAME = os.getenv("MONGODB_DATABASE_NAME")

client = AsyncIOMotorClient(MONGODB_URI)
db = client[f"{MONGODB_DATABASE_NAME}"]
user_collection = db["users"]

async def upsert_user(user_data:UserGithubInfo):
    username = user_data.username

    filter_query = {"username":username}
    user_data_upserted = {
        "username":username,
        "name":user_data.name,
        "access_token":user_data.access_token,
        "updatedAt":datetime.utcnow(),
        "is_active":True
    }
    update_query = {
        "$set": user_data_upserted,
        "$setOnInsert":{
            "createdAt":datetime.utcnow()
        }
    }
    upsert_response = await user_collection.update_one(filter_query,update_query,upsert=True)
    if upsert_response.did_upsert:
        return {"upserted":True}
    return {"upserted":False}
    
async def set_user_inactive(user_data:UserInfo):
    username = user_data.username
    filter_query = {"username":username}
    update_response = await user_collection.update_one(
        filter_query,
        {
            "$set":{
                "is_active":False,
                "access_token":None
            }
        }
    )
    if update_response.did_upsert:
        return {"updated":True}
    return {"updated":False}
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
load_dotenv()
import os

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DATABASE_NAME = os.getenv("MONGODB_DATABASE_NAME")

client = AsyncIOMotorClient(MONGODB_URI)
db = client[f"{MONGODB_DATABASE_NAME}"]
user_collection = db["users"]

async def delete_installation_id(username:str):
    filter_query = {"username":username}
    update_query = {
        "$unset":{
            "installation_id":""
        }
    }
    find_and_delete_response = await user_collection.update_one(filter_query,update_query)
    if find_and_delete_response.modified_count > 0:
        return {"success":True}
    return {"success":False}

async def addupdate_installation_id(user_data:dict):
    filter_query = {"username":user_data["username"]}
    update_query = {
        "$set":{"installation_id":user_data["installation_id"]}
    }
    
    addupdate_response = await user_collection.update_one(filter_query,update_query)
    if addupdate_response.modified_count >0:
        return {"success":True}
    return {"success":False}

async def get_installation_id(username:str):
    find_response = await user_collection.find_one({"username":username})
    if not find_response:
        raise HTTPException(status_code=404, detail="User not found")
    if "installation_id" in find_response:
        return find_response.get("installation_id")
    return None
    
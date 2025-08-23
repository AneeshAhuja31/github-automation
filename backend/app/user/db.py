from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.requests import Request
from fastapi.exceptions import HTTPException
from auth.security import verify_token
from auth.schemas import UserTokenInfo
from datetime import datetime
import os
from dotenv import load_dotenv
load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DATABASE_NAME = os.getenv("MONGODB_DATABASE_NAME")

client = AsyncIOMotorClient(MONGODB_URI)
db = client[f"{MONGODB_DATABASE_NAME}"]
user_collection = db["users"]

async def get_user_access_token(request:Request) -> str:
    user_token_info:UserTokenInfo = await verify_token(request)
    access_token_response = await user_collection.find_one(
        {
            "username":user_token_info.username
        }
    )
    if not access_token_response:
        raise HTTPException(status_code=404, detail="User not found")
    
    access_token = access_token_response.get("access_token")
    if not access_token:
        raise HTTPException(status_code=401, detail="Access token not found for user")
    
    return access_token
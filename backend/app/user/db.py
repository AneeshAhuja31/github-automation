from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.requests import Request
from datetime import datetime
import os
from dotenv import load_dotenv
load_dotenv(override=True)

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DATABASE_NAME = os.getenv("MONGODB_DATABASE_NAME")

client = AsyncIOMotorClient(MONGODB_URI)
db = client[f"{MONGODB_DATABASE_NAME}"]
user_collection = db["users"]

async def get_user_access_token(request:Request) -> str:
    username = request.cookies.get("username")
    access_token_response = await user_collection.find_one(
        {
            "username":username
        }
    )
    access_token = access_token_response.get("access_token")
    return access_token
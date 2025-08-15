import jwt
import os
from datetime import datetime,timedelta
from auth.schemas import UserTokenInfo
from dotenv import load_dotenv
load_dotenv()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_EXPIRATION_HOURS = os.getenv("JWT_EXPIRATION_HOURS")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")

async def create_token(usertokeninfo:UserTokenInfo):
    payload = {
        "sub":usertokeninfo.id,
        "username":usertokeninfo.username,
        "name":usertokeninfo.name,
        "avatar_url":usertokeninfo.avatar_url,
        "iat":datetime.utcnow(),
        "exp":datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload,JWT_SECRET_KEY,algorithm=JWT_ALGORITHM)
import jwt
import os
from datetime import datetime,timedelta
from auth.schemas import UserTokenInfo
from fastapi.requests import Request
from fastapi.exceptions import HTTPException
from dotenv import load_dotenv
load_dotenv()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS"))
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

async def verify_token(request:Request) -> UserTokenInfo:
    token = request.cookies.get("auth_token")
    print(token)
    if not token:
        raise HTTPException(status_code=401,detail="Missing auth token")
    try:
        payload = jwt.decode(token,JWT_SECRET_KEY,algorithms=[JWT_ALGORITHM])
        user_data = UserTokenInfo(
            username=payload["username"],
            name=payload["name"],
            id=payload["sub"],
            avatar_url=payload["avatar_url"]
        )
        return user_data
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401,detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401,detail="Invalid Token")
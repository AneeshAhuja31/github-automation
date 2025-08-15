from fastapi import APIRouter,HTTPException
from fastapi.responses import RedirectResponse
import httpx
from auth.schemas import UserInfo,UserTokenInfo
from auth.user_db import create_or_update_user
from auth.security import create_token
import os
from dotenv import load_dotenv

load_dotenv()

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL")
JWT_EXPIRATION_HOURS = os.getenv("JWT_EXPIRATION_HOURS")

router = APIRouter(prefix="/auth",tags=["auth"])

@router.get("/login")
async def login():
    github_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_CLIENT_ID}"
        f"&scope=repo user"
    )
    return RedirectResponse(github_url)

@router.get("/callback")
async def callback(code:str):
    headers = {"Accept":"application/json"}
    params = {
        "client_id":GITHUB_CLIENT_ID,
        "client_secret":GITHUB_CLIENT_SECRET,
        "code":code
    }
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://github.com/login/oauth/access_token",
            headers=headers,
            params=params,
        )
    response_json = token_response.json()
    access_token = response_json.get("access_token")
    print(access_token)
    headers = {"Authorization":f"Bearer {access_token}"}

    async with httpx.AsyncClient() as client:
        user_response = await client.get(
            "https://api.github.com/user",
            headers=headers
        )
    user_response_json = user_response.json()
    username = user_response_json.get("login")
    name = user_response_json.get("name")
    if not username or not name:
        return RedirectResponse(f"{FRONTEND_URL}/login.html")
    upsert_response = create_or_update_user(UserInfo(username,name))
    if not upsert_response["upsert"]:
        return RedirectResponse(f"{FRONTEND_URL}/login.html")
    usertokeninfo = UserTokenInfo(
        username=username,
        name=name,
        id=str(user_response_json.get("id")),
        avatar_url=user_response_json.get("avatar_url"),
    )
    token = create_token(usertokeninfo)
    response = RedirectResponse(f"{FRONTEND_URL}/dashboard.html")
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        secure=False,#change to True in prod
        samesite="lax", #change to none in prod
        max_age=JWT_EXPIRATION_HOURS
    )
    return response
        


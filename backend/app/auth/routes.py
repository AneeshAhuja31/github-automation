from fastapi import APIRouter,HTTPException,Depends
from fastapi.responses import RedirectResponse,JSONResponse
import httpx
from auth.schemas import UserInfo,UserTokenInfo,UserGithubInfo
from auth.db import upsert_user,set_user_inactive
from auth.security import create_token,verify_token
import os
from dotenv import load_dotenv

load_dotenv()

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL")
JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS"))

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
    try:
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
            return RedirectResponse(f"{FRONTEND_URL}/login.html?msg=noname")
        upsert_response = await upsert_user(UserGithubInfo(username=username,name=name,access_token=access_token))
        # if not upsert_response["upserted"]:
        #     return RedirectResponse(f"{FRONTEND_URL}/login.html?msg=already_upserted")
        usertokeninfo = UserTokenInfo(
            username=username,
            name=name,
            id=str(user_response_json.get("id")),
            avatar_url=user_response_json.get("avatar_url"),
        )
        token = await create_token(usertokeninfo)
        response = RedirectResponse(f"{FRONTEND_URL}/dashboard.html")
        response.set_cookie(
            key="auth_token",
            value=token,
            httponly=True,
            secure=False,#change to True in prod
            samesite="lax", #change to none in prod
            max_age=JWT_EXPIRATION_HOURS * 3600
        )
        return response
    except Exception as e:
        print(f"Error in callback: {e}")
        return RedirectResponse(f"{FRONTEND_URL}/login.html?error=server_error")

@router.get("/me")
async def me(user_data:UserTokenInfo = Depends(verify_token)):
    if not user_data:
        raise HTTPException(status_code=401, detail="Not authenticated")
    content = {
        "username":user_data.username,
        "name":user_data.name,
        "id":user_data.id,
        "avatar_url":user_data.avatar_url
    }
    return JSONResponse(content=content)

@router.post("/logout")
async def logout(userinfo:UserInfo):
    update_response = await set_user_inactive(userinfo)
    logout_response = JSONResponse(content={"message":"Logged out successfully"})
    logout_response.delete_cookie(
        key="auth_token",
        httponly=True,
        secure=False, #change to true in Prod
        samesite="lax"
    )
    return logout_response

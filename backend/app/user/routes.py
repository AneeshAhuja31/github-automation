from fastapi import APIRouter,HTTPException,Depends
from user.db import get_user_access_token
import httpx

router = APIRouter(prefix="/user",tags=["user"])

@router.get("/repos")
async def get_user_repos(access_token:str = Depends(get_user_access_token)):
    async with httpx.AsyncClient() as client:
        repo_response = await client.get(
            "https://api.github.com/user/repos",
            headers={
                "Authorization":f"Bearer {access_token}"
            }
        )
        return repo_response

from fastapi import APIRouter, HTTPException, Depends
from user.db import get_user_access_token
import httpx

router = APIRouter(prefix="/user", tags=["user"])

@router.get("/repos")
async def get_user_repos(access_token: str = Depends(get_user_access_token)):
    try:
        async with httpx.AsyncClient() as client:
            repo_response = await client.get(
                "https://api.github.com/user/repos",
                headers={
                    "Authorization": f"Bearer {access_token}"
                }
            )
            
            if repo_response.status_code != 200:
                raise HTTPException(
                    status_code=repo_response.status_code,
                    detail="Failed to fetch repositories from GitHub"
                )
            
            return repo_response.json()
            
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Error connecting to GitHub API: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
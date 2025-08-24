from fastapi import APIRouter, HTTPException, Depends,Request
from user.db import get_user_access_token
from auth.security import verify_token
from auth.schemas import UserTokenInfo
from githubapp.db import get_installation_id
from githubapp.services import generate_jwt_for_githubapp_access,get_githubapp_installation_token,get_repos_with_app_access
import httpx
router = APIRouter(prefix="/user", tags=["user"])

@router.get("/repos")
async def get_user_repos(request:Request):
    try:
        user_token_info:UserTokenInfo = await verify_token(request)
        access_token = await get_user_access_token(user_token_info)
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
            installation_id = await get_installation_id(user_token_info.username)
            all_repos = repo_response.json()
            if installation_id:
                jwt_token = await generate_jwt_for_githubapp_access()
                github_app_installation_token = await get_githubapp_installation_token(installation_id,jwt_token,user_token_info.username)
                if github_app_installation_token:
                    cleaned_repos = await get_repos_with_app_access(github_app_installation_token)
                    print(cleaned_repos)
                    cleaned_repo_names = {repo["name"] for repo in cleaned_repos}

                    for repo in all_repos:
                        repo["app_access"] = repo["name"] in cleaned_repo_names
                else:
                    for repo in all_repos:
                        repo["app_access"] = False 
            else:
                for repo in all_repos:
                    repo["app_access"] = False 
            
            return all_repos
            
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Error connecting to GitHub API: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
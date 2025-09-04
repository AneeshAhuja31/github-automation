from fastapi import APIRouter,HTTPException,Request,Depends
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
        print("///////////////////////")
        print(access_token)
        print("///////////////////////")
        async with httpx.AsyncClient() as client:
            repo_response = await client.get(
                "https://api.github.com/user/repos?per_page=100",
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

@router.get("/get-issues/{repo}")
async def get_issues(repo:str,user_token_info:UserTokenInfo = Depends(verify_token)):
    try:
        username = user_token_info.username
        access_token = await get_user_access_token(user_token_info)
        
        async with httpx.AsyncClient() as client:
            issue_response = await client.get(
                f"https://api.github.com/repos/{username}/{repo}/issues",
                headers={
                    "Authorization": f"Bearer {access_token}"
                }
            )
        print("[[[[[[[[[[[[[[[[]]]]]]]]]]]]]]]]")
        print(access_token)
        print("[[[[[[[[[[[[[[[[]]]]]]]]]]]]]]]]")
        if issue_response.status_code != 200:
            raise HTTPException(
                status_code=issue_response.status_code,
                detail=f"Failed to fetch issues for {repo} from GitHub"
            )
        try:
            with open("issue.json","w") as f:
                import json
                json.dump(issue_response.json(), f)
        except Exception as e:
            print("herererere")
        
        print(issue_response.json())
        return issue_response.json()
        
    except Exception as e:
        
        raise HTTPException(status_code=500,detail=f"{e}")
    
@router.get("/check-repo/{username}/{repo}")
async def check_if_user_exist(username:str,repo:str):
    async with httpx.AsyncClient() as client:
        response = await client.get(f"https://api.github.com/repos/{username}/{repo}")
    
    if response.status_code == 200:
        return {"exists":True,"message":"Repository exists!"}
    elif response.status_code == 404:
        return {"exists":False,"message":"Repository doesnt exist!"}
    else:
        raise HTTPException(status_code=response.status_code,detail="GitHub API error")

@router.get("/get-branches/{repo}")
async def get_branch(repo:str,user_token_info:UserTokenInfo = Depends(verify_token)):
    try:
        username = user_token_info.username
        access_token = await get_user_access_token(user_token_info)
        async with httpx.AsyncClient() as client:
            branch_response = await client.get(f"https://api.github.com/repos/{username}/{repo}/branches",
                headers={
                    "Authorization": f"Bearer {access_token}"
                }
            )
        if branch_response.status_code != 200:
                raise HTTPException(
                    status_code=branch_response.status_code,
                    detail=f"Failed to fetch issues for {repo} from GitHub"
                )
        return branch_response.json()
    except Exception as e:
        raise HTTPException(status_code=500,detail=f"{e}")
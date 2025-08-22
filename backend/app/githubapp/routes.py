from fastapi import APIRouter,Request,HTTPException,Depends
from fastapi.responses import RedirectResponse,JSONResponse
from githubapp.services import get_installation_token
from auth.security import verify_token
from auth.schemas import UserTokenInfo
import os
import httpx
from dotenv import load_dotenv
load_dotenv()

FRONTEND_URL = os.getenv("FRONTEND_URL")

router = APIRouter(prefix="/githubapp",tags=["githubapp"])

# @router.get("/callback")
# async def callback(request:Request):
#     try:
#         installation_id = request.query_params.get("installation_id")
#         setup_action = request.query_params.get("setup_action")

#         if not installation_id:
#             return RedirectResponse(f"{FRONTEND_URL}/repositories.html?error=token_failed")
        
#         return RedirectResponse(f"{FRONTEND_URL}/repositories.html?githubapp_installed=true&installation_id={installation_id}")

#     except Exception as e:
#         print(f"Error in GitHub App callback: {e}")
#         return RedirectResponse(f"{FRONTEND_URL}/repositories.html?error=app_callback_failed")
    
@router.get("/install/{repo_owner}/{repo_name}")
async def install_app_on_repo(repo_owner: str, repo_name: str, user_data: UserTokenInfo = Depends(verify_token)):
    try:
        install_url = (
            f"https://github.com/apps/ForkliftBot/installations/new"
            f"?suggested_target_id={repo_owner}"
            f"&state={user_data.username}"
        )
        
        return JSONResponse({"install_url": install_url})
        
    except Exception as e:
        print(f"Error generating install URL: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate install URL")

@router.get("/repos/{installation_id}")
async def get_app_repos(installation_id: str, user_data: UserTokenInfo = Depends(verify_token)):
    """Get repositories accessible by the GitHub App installation"""
    try:
        access_token = await get_installation_token(installation_id)
        if not access_token:
            raise HTTPException(status_code=400, detail="Failed to get installation token")
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.github.com/installation/repositories",
                headers=headers
            )
            response.raise_for_status()
            return response.json()
            
    except Exception as e:
        print(f"Error getting app repos: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch repositories")

@router.post("/webhooks/github")
async def github_webhook():
    pass
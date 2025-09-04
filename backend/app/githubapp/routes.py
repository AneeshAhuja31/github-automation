from fastapi import APIRouter,Request,HTTPException,Depends
from fastapi.responses import RedirectResponse,JSONResponse
from githubapp.services import generate_jwt_for_githubapp_access,get_githubapp_installation_token,get_repos_with_app_access,is_repo_installed
from githubapp.db import addupdate_installation_id,get_installation_id
from auth.security import verify_token
from auth.schemas import UserTokenInfo
from user.db import get_user_access_token
import os
import httpx
from dotenv import load_dotenv
load_dotenv()

FRONTEND_URL = os.getenv("FRONTEND_URL")
GITHUB_APP_ID = int(os.getenv("GITHUB_APP_ID"))
router = APIRouter(prefix="/githubapp",tags=["githubapp"])

@router.get("/callback")
async def callback(request:Request):
    try:
        installation_id = request.query_params.get("installation_id")
        setup_action = request.query_params.get("setup_action")

        if not installation_id:
            return RedirectResponse(f"{FRONTEND_URL}/repositories.html?error=token_failed")
        user_data = await verify_token(request)
        username = user_data.username
        addupdate_response = await addupdate_installation_id({"username":username,"installation_id":installation_id})
        
        if not addupdate_response["success"]:
            print(f"Error in GitHub App callback: {e}")
            return RedirectResponse(f"{FRONTEND_URL}/repositories.html?error=installation_id_not_updated")
        return RedirectResponse(f"{FRONTEND_URL}/repositories.html?githubapp_installed=true&installation_id={installation_id}")
        
    except Exception as e:
        print(f"Error in GitHub App callback: {e}")
        return RedirectResponse(f"{FRONTEND_URL}/repositories.html?error=app_callback_failed")
    
@router.get("/install/{repo_owner}")
async def install_app_on_repo(repo_owner: str, user_data: UserTokenInfo = Depends(verify_token)):
    try:
        print(user_data.username)
        print(user_data.name)
        print(user_data.id)
        install_url = (
            f"https://github.com/apps/forkliftbot/installations/new/permissions"
            f"?target_id={user_data.id}"
        )
        print(install_url)
        return JSONResponse({"install_url": install_url})
        
    except Exception as e:
        print(f"Error generating install URL: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate install URL")

@router.get("/get-installed-repos/{username}")
async def get_repos(username:str):
    installation_id = await get_installation_id(username)
    jwt_token = await generate_jwt_for_githubapp_access()
    github_app_installation_token = await get_githubapp_installation_token(installation_id,jwt_token,username)
    repos = await get_repos_with_app_access(github_app_installation_token)
    return JSONResponse({"repositories":repos})

@router.post("/webhooks/github")
async def github_webhook():
    pass

@router.get("/check-repo/{username}/{repo}")
async def check_if_app_installated_on_repo(username:str,repo:str):
    installation_id = await get_installation_id(username)
    jwt_token = await generate_jwt_for_githubapp_access()
    github_app_installation_token = await get_githubapp_installation_token(installation_id,jwt_token,username)
    check_if_app_installed = await is_repo_installed(github_app_installation_token,username,repo)
    if not check_if_app_installed:
        raise HTTPException(status_code=401,detail="Github app not installed on repo")
    return JSONResponse(status_code=200,content={"success":True})

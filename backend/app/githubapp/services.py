import time
import jwt
import os
import httpx
from dotenv import load_dotenv
from githubapp.db import delete_installation_id
load_dotenv()

GITHUB_APP_ID = os.getenv("GITHUB_APP_ID")
private_key_path = os.getenv("GITHUB_PRIVATE_KEY")
with open(private_key_path, "r") as f:
    GITHUB_PRIVATE_KEY = f.read()
FRONTEND_URL = os.getenv("FRONTEND_URL")

async def generate_jwt_for_githubapp_access():
    payload = {
        "iat":int(time.time()) - 60,
        "exp":int(time.time()) + (5 * 60),
        "iss":GITHUB_APP_ID
    }
    print("mmmmmmmmmmmmmmmm")
    print(jwt.encode(payload,GITHUB_PRIVATE_KEY,algorithm="RS256"))
    print("mmmmmmmmmmmmmmmm")
    return jwt.encode(payload,GITHUB_PRIVATE_KEY,algorithm="RS256")

async def get_githubapp_installation_token(installation_id:str,token:str,username:str):
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json"
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(f"https://api.github.com/app/installations/{installation_id}/access_tokens",headers=headers)
        if response.status_code >= 400:  
            print(f"GitHub API Error: {response.status_code}")
            print(response.json())
            await delete_installation_id(username)
            return None
        
        if response.status_code != 201: 
            print(f"Unexpected status code: {response.status_code}")
            return None
            
    response_json = response.json()
    if "token" not in response_json:
        print("No token in response")
        return None
        
    return response_json["token"]

async def get_repos_with_app_access(github_app_installation_token:str) -> list:
    headers = {
        "Authorization": f"Bearer {github_app_installation_token}",
        "Accept": "application/vnd.github+json"
    }
    async with httpx.AsyncClient() as client:
        response = await client.get("https://api.github.com/installation/repositories?per_page=100",headers=headers)
    print(response.json())
    repositories = response.json()["repositories"]
    cleaned_repositories = [
        {
            "full_name":repo["full_name"],
            "name":repo["name"]
        }  for repo in repositories
    ]
    print(len(repositories))
    return cleaned_repositories

async def is_repo_installed(installation_token: str, owner: str, repo: str) -> bool:
    headers = {
        "Authorization": f"Bearer {installation_token}",
        "Accept": "application/vnd.github+json"
    }
    async with httpx.AsyncClient() as client:
        response = await client.get("https://api.github.com/installation/repositories?per_page=100", headers=headers)
    if response.status_code != 200:
        return False
    repos = response.json().get("repositories", [])
    full_name = f"{owner}/{repo}"
    return any(r.get("full_name") == full_name for r in repos)


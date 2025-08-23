import time
import jwt
import os
import httpx
from dotenv import load_dotenv
load_dotenv()

GITHUB_APP_ID = os.getenv("GITHUB_APP_ID")
private_key_path = os.getenv("GITHUB_PRIVATE_KEY")
with open(private_key_path, "r") as f:
    GITHUB_PRIVATE_KEY = f.read()
FRONTEND_URL = os.getenv("FRONTEND_URL")

async def generate_jwt_for_githubapp_access():
    payload = {
        "iat":int(time.time()) - 60,
        "exp":int(time.time()) + (10 * 60),
        "iss":GITHUB_APP_ID
    }
    return jwt.encode(payload,GITHUB_PRIVATE_KEY,algorithm="RS256")

async def get_githubapp_installation_token(installation_id:str,token:str):
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json"
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(f"https://api.github.com/app/installations/{installation_id}/access_tokens",headers=headers)
    response_json = response.json()
    github_app_installation_token = response_json["token"]
    return github_app_installation_token

async def get_repos_with_app_access(github_app_installation_token:str):
    headers = {
        "Authorization": f"Bearer {github_app_installation_token}",
        "Accept": "application/vnd.github+json"
    }
    async with httpx.AsyncClient() as client:
        response = await client.get("https://api.github.com/installation/repositories",headers=headers)


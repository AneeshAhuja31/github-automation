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
async def generate_jwt():
    payload = {
        "iat":int(time.time()) - 60,
        "exp":int(time.time()) + (10 * 60),
        "iss":GITHUB_APP_ID
    }
    return jwt.encode(payload,GITHUB_PRIVATE_KEY,algorithm="RS256")

async def get_installation_token(installation_id:str):
    try:
        jwt_token = await generate_jwt()
        headers = {
            "Authorization":f"Bearer {jwt_token}",
            "Accept":"application/vnd.github+json",
            "X-Github-Api-Version":"2022-11-28"
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api.github.com/app/installations/{installation_id}/access_tokens",
                headers=headers
            )
            response.raise_for_status()
            return response.json()["token"]
    except Exception as e:
        print(f"Error getting installation token: {e}")
        return None
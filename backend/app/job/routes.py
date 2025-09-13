from fastapi.routing import APIRouter
from fastapi.requests import Request
from user.db import get_user_access_token
from auth.security import verify_token
from auth.schemas import UserTokenInfo
router = APIRouter(prefix="/job",tags=["job"])

@router.post("/create-job")
async def create_job(request:Request):
    body = await request.json()
    user_token_info:UserTokenInfo = await verify_token(request)
    access_token = await get_user_access_token(user_token_info)
    print(access_token)
    
    
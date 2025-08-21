from fastapi import APIRouter

router = APIRouter(prefix="/githubapp",tags=["githubapp"])

@router.geT("/callback")
async def callback():
    pass

@router.post("/webhooks/github")
async def github_webhook():
    pass
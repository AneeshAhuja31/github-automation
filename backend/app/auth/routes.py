from fastapi import APIRouter,HTTPException

router = APIRouter(prefix="/auth",tags=["auth"])

@router.post("/login")
async def login():
    pass
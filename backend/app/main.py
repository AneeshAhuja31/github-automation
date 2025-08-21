from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth.routes import router as auth_router
from user.routes import router as user_router
from githubapp.routes import router as githubapp_router
import uvicorn
import os
from dotenv import load_dotenv
load_dotenv()

app = FastAPI()

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(githubapp_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/")
async def index():
    return {"message":"Welcome to Forklift"}



if __name__ == "__main__":
    port = int(os.getenv("PORT"))
    uvicorn.run("main:app",host="0.0.0.0",port=port,reload=True)
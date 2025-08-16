from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth import routes as auth_routes
import uvicorn
import os
from dotenv import load_dotenv
load_dotenv()

app = FastAPI()

app.include_router(auth_routes.router)
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
    uvicorn.run("main:app",host="0.0.0.0",port=port)
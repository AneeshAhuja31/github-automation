from fastapi import FastAPI
from auth import routes as auth_routes
import uvicorn
import os
from dotenv import load_dotenv
load_dotenv()

app = FastAPI()

app.include_router(auth_routes.router)

@app.get("/")
async def index():
    return {"message":"Welcome to Forklift"}

if __name__ == "__main__":
    port = int(os.getenv("PORT"))
    uvicorn.run("main:app",host="0.0.0.0",port=port)
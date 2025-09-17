from fastapi.routing import APIRouter
from fastapi.requests import Request
from fastapi import Depends,HTTPException
from fastapi.responses import JSONResponse
from user.db import get_user_access_token
from auth.security import verify_token
from auth.schemas import UserTokenInfo
from job.services import fetch_entire_repo,CodePreprocessor
from job.embeddings import CodeEmbeddingGenerator
from job.vectorstore import CodeVectorStore
router = APIRouter(prefix="/job",tags=["job"])

# @router.post("/create-job")
# async def create_job(request:Request):
#     body = await request.json()
#     user_token_info:UserTokenInfo = await verify_token(request)
#     access_token = await get_user_access_token(user_token_info)
#     print(access_token)
    
@router.post("/index-repository")
async def index_repository(request:Request,user_token_info:UserTokenInfo = Depends(verify_token)):
    try:
        print("[[[[[[[[[[[[[[[[[[]]]]]]]]]]]]]]]]]]")

        body = await request.json()
        repo_name = body.get('repo_name')
        branch = body.get('branch','main')
        print("[[[[[[[[[[[[[[[[[[]]]]]]]]]]]]]]]]]]")
        if not repo_name:
            raise HTTPException(status_code=400,detail="Repo name is required")
        access_token = await get_user_access_token(user_token_info)
        username = user_token_info.username
        
        print(f"Fetching repository {username}/{repo_name}...")
        files_data = await fetch_entire_repo(username,repo_name,access_token,branch)
        
        print(f"Processing {len(files_data)} files...")
        processor = CodePreprocessor()
        all_chunks = []
        
        for file_data in files_data:
            chunks = processor.preprocess_file(file_data)
            all_chunks.extend(chunks)
        
        print(f"Generating embeddings for {len(all_chunks)} code chunks...")
        embedding_generator = CodeEmbeddingGenerator()
        chunks_with_embeddings = embedding_generator.generate_embeddings(all_chunks)
        
        print("Storing embeddings in vector database...")
        vector_store = CodeVectorStore()
        vector_store.store_embeddings(chunks_with_embeddings,repo_name)
        
        return JSONResponse(content={
            "status":"success",
            "message":f"Successfully indexed {len(files_data)} files with {len(all_chunks)} code chunks",
            "files_processed":len(files_data),
            "chunks_created":len(all_chunks)
        })
    except Exception as e:
        print(f"Error indexing repository: {e}")
        raise HTTPException(status_code=500,detail=f"Failed to index repository: {str(e)}")


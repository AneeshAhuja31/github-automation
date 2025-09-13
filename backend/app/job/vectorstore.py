import chromadb
from chromadb.config import Settings
from typing import List, Dict, Any
import uuid

class CodeVectorStore:
    def __init__(self, collection_name: str = "code_embeddings"):
        self.client = chromadb.Client(Settings(
            chroma_db_impl="duckdb+parquet",
            persist_directory="./vector_db"
        ))
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )
    
    def store_embeddings(self, chunks_with_embeddings: List[Dict[str, Any]], repo_name: str):
        """Store embeddings in vector database"""
        ids = []
        embeddings = []
        documents = []
        metadatas = []
        
        for chunk in chunks_with_embeddings:
            chunk_id = f"{repo_name}_{chunk['file_path']}_{chunk.get('line_start', 0)}"
            ids.append(chunk_id)
            embeddings.append(chunk['embedding'])
            documents.append(chunk['enhanced_text'])
            
            metadata = {
                'repo_name': repo_name,
                'file_path': chunk['file_path'],
                'type': chunk.get('type', 'generic'),
                'name': chunk.get('name', ''),
                'line_start': chunk.get('line_start', 0),
                'line_end': chunk.get('line_end', 0)
            }
            metadatas.append(metadata)
        
        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )
    
    def search_similar_code(self, query: str, n_results: int = 10, repo_name: str = None):
        """Search for similar code chunks"""
        where_clause = {}
        if repo_name:
            where_clause['repo_name'] = repo_name
        
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results,
            where=where_clause if where_clause else None
        )
        
        return results
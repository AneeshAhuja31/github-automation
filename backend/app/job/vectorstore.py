import os
import json
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.http.models import (
    VectorParams,
    Distance,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
)
from dotenv import load_dotenv
load_dotenv(override=True)

QDRANT_URL = os.getenv("QDRANT_URL")

class CodeVectorStore:
    def __init__(
        self,
        collection_name: str = "code_embeddings",
        persist_directory: str = "./vector_db",
        api_key: Optional[str] = None,
        dimension: int = 768,
    ):
        self.collection_name = collection_name
        self.persist_directory = persist_directory
        self.dimension = dimension

        os.makedirs(persist_directory, exist_ok=True)

        self.qdrant_client = QdrantClient(url=QDRANT_URL or "http://localhost:6333")

        try:
            self.qdrant_client.get_collection(collection_name=self.collection_name)
        except Exception:
            self.qdrant_client.recreate_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=self.dimension, distance=Distance.COSINE),
            )

    def store_embeddings(self, chunks_with_embeddings: List[Dict[str, Any]], repo_name: str):
        """Store embeddings in Qdrant collection"""
        points: List[PointStruct] = []

        for chunk in chunks_with_embeddings:
            chunk_id = f"{repo_name}_{chunk['file_path']}_{chunk.get('line_start', 0)}"

            # Prepare metadata
            payload = {
                'id': chunk_id,
                'repo_name': repo_name,
                'file_path': chunk['file_path'],
                'type': chunk.get('type', 'generic'),
                'name': chunk.get('name', ''),
                'line_start': chunk.get('line_start', 0),
                'line_end': chunk.get('line_end', 0),
                'document': chunk.get('enhanced_text', ''),
            }

            vector = [float(x) for x in chunk['embedding']]

            # Use chunk_id as point id to enable easy deletes by repo
            points.append(PointStruct(id=chunk_id, vector=vector, payload=payload))

        if points:
            # Upsert points
            self.qdrant_client.upsert(collection_name=self.collection_name, points=points)

    def search_similar_code(self, query: str, n_results: int = 10, repo_name: str = None) -> Dict[str, Any]:
        """Search for similar code chunks using Qdrant"""
        # Lazy import embedding generator to avoid circular import at module load
        from .embeddings import CodeEmbeddingGenerator

        embedding_generator = CodeEmbeddingGenerator()
        query_embedding = embedding_generator.model.encode([query])[0].tolist()

        # Build filter if repo_name provided
        qdrant_filter = None
        if repo_name:
            qdrant_filter = Filter(must=[FieldCondition(key="repo_name", match=MatchValue(value=repo_name))])

        search_result = self.qdrant_client.search(
            collection_name=self.collection_name,
            query_vector=query_embedding,
            limit=n_results,
            with_payload=True,
            with_vector=False,
            query_filter=qdrant_filter,
        )

        results = {'ids': [[]], 'distances': [[]], 'documents': [[]], 'metadatas': [[]]}

        for hit in search_result:
            results['ids'][0].append(hit.id)
            results['distances'][0].append(float(hit.score) if hit.score is not None else None)
            payload = hit.payload or {}
            results['documents'][0].append(payload.get('document', ''))
            results['metadatas'][0].append(payload)

        return results

    def delete_by_repo(self, repo_name: str):
        """Delete all embeddings for a specific repository using a filter on payload.repo_name"""
        # Qdrant doesn't support delete by filter in older clients; use scroll + delete
        try:
            # Collect IDs to delete
            hits = self.qdrant_client.search(
                collection_name=self.collection_name,
                query_vector=[0.0] * self.dimension,
                limit=1,
                with_payload=True,
                query_filter=Filter(must=[FieldCondition(key="repo_name", match=MatchValue(value=repo_name))]),
            )
        except Exception:
            # Fallback: use search with no query vector to retrieve by filter
            hits = []

        # Retrieve all ids by scrolling via search with a small dummy vector and pagination
        offset = 0
        batch = 100
        ids_to_delete = []
        while True:
            resp = self.qdrant_client.scroll(collection_name=self.collection_name, limit=batch, offset=offset, filter=Filter(must=[FieldCondition(key="repo_name", match=MatchValue(value=repo_name))]))
            if not resp or not resp[0].payload:
                break
            for point in resp:
                ids_to_delete.append(point.id)
            if len(resp) < batch:
                break
            offset += batch

        if ids_to_delete:
            # Delete by ids
            self.qdrant_client.delete(collection_name=self.collection_name, points=ids_to_delete)

    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the Qdrant collection"""
        info = self.qdrant_client.count(collection_name=self.collection_name)
        return {
            'total_embeddings': info.count if hasattr(info, 'count') else info,
            'dimension': self.dimension,
            'index_type': 'Qdrant',
        }

    def clear_all(self):
        """Clear all data from the vector store (recreate collection)"""
        self.qdrant_client.recreate_collection(
            collection_name=self.collection_name,
            vectors_config=VectorParams(size=self.dimension, distance=Distance.COSINE),
        )
import faiss
import numpy as np
import pickle
import os
from typing import List, Dict, Any
import json

class CodeVectorStore:
    def __init__(self, collection_name: str = "code_embeddings", persist_directory: str = "./vector_db"):
        self.collection_name = collection_name
        self.persist_directory = persist_directory
        self.dimension = 768  # CodeBERT embedding dimension
        
        # Create persist directory if it doesn't exist
        os.makedirs(persist_directory, exist_ok=True)
        
        # File paths for persistence
        self.index_path = os.path.join(persist_directory, f"{collection_name}_index.faiss")
        self.metadata_path = os.path.join(persist_directory, f"{collection_name}_metadata.pkl")
        self.documents_path = os.path.join(persist_directory, f"{collection_name}_documents.pkl")
        
        # Initialize or load existing index
        self.index = None
        self.metadata = []
        self.documents = []
        self.id_to_index = {}
        
        self._load_or_create_index()
    
    def _load_or_create_index(self):
        """Load existing index or create new one"""
        if os.path.exists(self.index_path) and os.path.exists(self.metadata_path):
            # Load existing index
            self.index = faiss.read_index(self.index_path)
            
            with open(self.metadata_path, 'rb') as f:
                self.metadata = pickle.load(f)
            
            with open(self.documents_path, 'rb') as f:
                self.documents = pickle.load(f)
            
            # Rebuild id_to_index mapping
            for i, meta in enumerate(self.metadata):
                self.id_to_index[meta.get('id', f'chunk_{i}')] = i
        else:
            # Create new index
            self.index = faiss.IndexFlatIP(self.dimension)  # Inner Product (cosine similarity)
            self.metadata = []
            self.documents = []
            self.id_to_index = {}
    
    def store_embeddings(self, chunks_with_embeddings: List[Dict[str, Any]], repo_name: str):
        """Store embeddings in FAISS index"""
        new_embeddings = []
        new_metadata = []
        new_documents = []
        
        for chunk in chunks_with_embeddings:
            chunk_id = f"{repo_name}_{chunk['file_path']}_{chunk.get('line_start', 0)}"
            
            # Skip if already exists
            if chunk_id in self.id_to_index:
                continue
            
            embedding = np.array(chunk['embedding'], dtype=np.float32)
            # Normalize for cosine similarity
            embedding = embedding / np.linalg.norm(embedding)
            
            new_embeddings.append(embedding)
            
            metadata = {
                'id': chunk_id,
                'repo_name': repo_name,
                'file_path': chunk['file_path'],
                'type': chunk.get('type', 'generic'),
                'name': chunk.get('name', ''),
                'line_start': chunk.get('line_start', 0),
                'line_end': chunk.get('line_end', 0)
            }
            new_metadata.append(metadata)
            new_documents.append(chunk['enhanced_text'])
        
        if new_embeddings:
            # Convert to numpy array
            embeddings_array = np.vstack(new_embeddings)
            
            # Add to index
            self.index.add(embeddings_array)
            
            # Update metadata and documents
            start_idx = len(self.metadata)
            self.metadata.extend(new_metadata)
            self.documents.extend(new_documents)
            
            # Update id_to_index mapping
            for i, meta in enumerate(new_metadata):
                self.id_to_index[meta['id']] = start_idx + i
            
            # Persist to disk
            self._save_index()
    
    def search_similar_code(self, query: str, n_results: int = 10, repo_name: str = None):
        """Search for similar code chunks"""
        if self.index.ntotal == 0:
            return {
                'ids': [[]],
                'distances': [[]],
                'documents': [[]],
                'metadatas': [[]]
            }
        
        # For text query, we need to encode it first
        # This assumes you have access to the embedding model
        from .embeddings import CodeEmbeddingGenerator
        
        embedding_generator = CodeEmbeddingGenerator()
        query_embedding = embedding_generator.model.encode([query])
        query_embedding = query_embedding[0] / np.linalg.norm(query_embedding[0])
        query_embedding = query_embedding.reshape(1, -1).astype(np.float32)
        
        # Search in FAISS
        scores, indices = self.index.search(query_embedding, min(n_results, self.index.ntotal))
        
        # Filter results
        filtered_results = {
            'ids': [[]],
            'distances': [[]],
            'documents': [[]],
            'metadatas': [[]]
        }
        
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:  # Invalid index
                continue
                
            metadata = self.metadata[idx]
            
            # Apply repo filter if specified
            if repo_name and metadata.get('repo_name') != repo_name:
                continue
            
            filtered_results['ids'][0].append(metadata['id'])
            filtered_results['distances'][0].append(float(score))
            filtered_results['documents'][0].append(self.documents[idx])
            filtered_results['metadatas'][0].append(metadata)
        
        return filtered_results
    
    def _save_index(self):
        """Save index and metadata to disk"""
        faiss.write_index(self.index, self.index_path)
        
        with open(self.metadata_path, 'wb') as f:
            pickle.dump(self.metadata, f)
        
        with open(self.documents_path, 'wb') as f:
            pickle.dump(self.documents, f)
    
    def delete_by_repo(self, repo_name: str):
        """Delete all embeddings for a specific repository"""
        indices_to_remove = []
        
        for i, meta in enumerate(self.metadata):
            if meta.get('repo_name') == repo_name:
                indices_to_remove.append(i)
        
        if indices_to_remove:
            # FAISS doesn't support direct deletion, so we need to rebuild
            self._rebuild_index_without_indices(indices_to_remove)
    
    def _rebuild_index_without_indices(self, indices_to_remove: List[int]):
        """Rebuild index without specified indices"""
        # Get all embeddings from current index
        all_embeddings = []
        for i in range(self.index.ntotal):
            embedding = self.index.reconstruct(i)
            all_embeddings.append(embedding)
        
        # Filter out embeddings and metadata to remove
        new_embeddings = []
        new_metadata = []
        new_documents = []
        
        for i in range(len(all_embeddings)):
            if i not in indices_to_remove:
                new_embeddings.append(all_embeddings[i])
                new_metadata.append(self.metadata[i])
                new_documents.append(self.documents[i])
        
        # Create new index
        self.index = faiss.IndexFlatIP(self.dimension)
        if new_embeddings:
            embeddings_array = np.vstack(new_embeddings)
            self.index.add(embeddings_array)
        
        # Update metadata and documents
        self.metadata = new_metadata
        self.documents = new_documents
        
        # Rebuild id_to_index mapping
        self.id_to_index = {}
        for i, meta in enumerate(self.metadata):
            self.id_to_index[meta['id']] = i
        
        # Save updated index
        self._save_index()
    
    def get_stats(self):
        """Get statistics about the vector store"""
        return {
            'total_embeddings': self.index.ntotal if self.index else 0,
            'dimension': self.dimension,
            'index_type': 'FAISS IndexFlatIP',
            'repos': list(set(meta.get('repo_name', 'unknown') for meta in self.metadata))
        }
    
    def clear_all(self):
        """Clear all data from the vector store"""
        self.index = faiss.IndexFlatIP(self.dimension)
        self.metadata = []
        self.documents = []
        self.id_to_index = {}
        
        # Remove files
        for path in [self.index_path, self.metadata_path, self.documents_path]:
            if os.path.exists(path):
                os.remove(path)
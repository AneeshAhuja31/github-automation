from sentence_transformers import SentenceTransformer
from langchain_huggingface import HuggingFaceEndpointEmbeddings
from typing import List,Dict,Any

import os
from dotenv import load_dotenv
load_dotenv(override=True)

HF_TOKEN = os.getenv("HF_TOKEN")
class CodeEmbeddingGenerator:
    def __init__(self,model_name:str = "microsoft/codebert-base"):
        self.model = HuggingFaceEndpointEmbeddings(model=model_name,huggingfacehub_api_token=HF_TOKEN)
        # self.model = HuggingFaceEmbeddings(model_name=model_name)
    def create_enhanced_text(self,chunk:Dict[str,Any]) -> str:
        content = chunk['content']
        file_path = chunk['file_path']
        chunk_type = chunk.get('type', 'generic')
        metadata = chunk.get('metadata', {})
        
        enhanced_text = f"File: {file_path}\n"
        enhanced_text += f"Type: {chunk_type}\n"
        
        if chunk_type == 'function':
            enhanced_text += f"Function: {chunk.get('name', 'unknown')}\n"
            if 'args' in metadata:
                enhanced_text += f"Arguments: {', '.join(metadata['args'])}\n"
            if chunk.get('docstring'):
                enhanced_text += f"Documentation: {chunk['docstring']}\n"
        
        elif chunk_type == 'class':
            enhanced_text += f"Class: {chunk.get('name', 'unknown')}\n"
            if 'base_classes' in metadata:
                enhanced_text += f"Inherits from: {', '.join(metadata['base_classes'])}\n"
            if chunk.get('docstring'):
                enhanced_text += f"Documentation: {chunk['docstring']}\n"
        
        enhanced_text += f"\nCode:\n{content}"
        
        return enhanced_text
    
    def generate_embeddings(self, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate embeddings for code chunks"""
        enhanced_texts = [self.create_enhanced_text(chunk) for chunk in chunks]
        
        embeddings = self.model.embed_documents(enhanced_texts)
        # Add embeddings to chunks
        for i, chunk in enumerate(chunks):
            chunk['embedding'] = embeddings[i].tolist()
            chunk['enhanced_text'] = enhanced_texts[i]
        
        return chunks
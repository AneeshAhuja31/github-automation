import httpx
import base64
from typing import List, Dict, Any
import re
import ast
from pathlib import Path

async def fetch_entire_repo(username:str,repo_name:str,access_token:str,branch:str="main") -> List[Dict[str,Any]]:
    files_data = []
    
    async with httpx.AsyncClient() as client:
        tree_response = await client.get(
            f"https://api.github.com/repos/{username}/{repo_name}/git/trees/{branch}?recursive=1",
            headers={"Authorization":f"Bearer {access_token}"}
        )
        if tree_response.status_code != 200:
            return Exception(f"Failed to fetch repository tree: {tree_response.status_code}")
        tree = tree_response.json()
        code_extensions = {
                '.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.cpp', '.c', '.h', 
                '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala',
                '.html', '.css', '.scss', '.sass', '.vue', '.svelte', '.sql',
                '.md', '.yml', '.yaml', '.json', '.xml', '.toml', '.ini'
            }
        for item in tree["tree"]:
            if item["type"] == "blob":
                file_path = item["path"]
                file_extension = Path(file_path).suffix.lower()
                if file_extension in code_extensions and item.get('size', 0) < 1000000:  # 1MB limit
                    try:
                        file_response = await client.get(
                            f"https://api.github.com/repos/{username}/{repo_name}/contents/{file_path}",
                            headers={"Authorization":f"Bearer {access_token}"}
                        )
                        
                        if file_response.status_code == 200:
                            file_data = file_response.json()
                            content = base64.b64decode(file_data['content']).decode('utf-8',errors='ignore')
                            
                            files_data.append({
                                'path':file_path,
                                'content':content,
                                'size':item.get('size',0),
                                'extension':file_extension,
                                'sha':item['sha']
                            })
                    except Exception as e:
                        print(f"Error fetching {file_path}: {e}")
                        continue
    return files_data

class CodePreprocessor:
    def __init__(self):
        self.language_parsers = {
            '.py':self.parse_python,
            '.js':self.parse_javascript,
            '.ts':self.parse_javascript,
            '.jsx':self.parse_javascript,
            '.tsx':self.parse_javascript,
        }
    
    def preprocess_file(self,file_data:Dict[str,Any]) -> List[Dict[str,Any]]:
        content = file_data['content']
        file_path = file_data['path']
        extension = file_data['extension']
        
        chunks = []
        
        if extension in self.language_parsers:
            chunks = self.language_parsers[extension](content,file_path)
        else:
            chunks = self.generic_chunk(content,file_path)
        return chunks
    
    def parse_python(self,content:str,file_path:str) -> List[Dict[str,Any]]:
        chunks = []
        try:
            tree = ast.parse(content)
            
            for node in ast.walk(tree):
                if isinstance(node,(ast.FunctionDef,ast.AsyncFunctionDef)):
                    func_lines = content.split('\n')[node.lineno-1:node.end_lineno]
                    func_content = '\n'.join(func_lines)
                    
                    docstring = ast.get_docstring(node) or ""
                    
                    chunks.append({
                        "type":"function",
                        "name":node.name,
                        "content":func_content,
                        "docstring":docstring,
                        "file_path":file_path,
                        "line_start":node.lineno,
                        "line_end":node.end_lineno,
                        "metadata":{
                            'args':[arg.arg for arg in node.args.args],
                            'decorators':[d.id if hasattr(d,'id') else str(d) for d in node.decorator_list]
                            
                        }
                    })
                elif isinstance(node,ast.ClassDef):
                    class_lines = content.split('\n')[node.lineno-1:node.end_lineno]
                    class_content = '\n'.join(class_lines)
                    
                    docstring = ast.get_docstring(node) or ""
                    
                    chunks.append({
                        'type': 'class',
                        'name': node.name,
                        'content': class_content,
                        'docstring': docstring,
                        'file_path': file_path,
                        'line_start': node.lineno,
                        'line_end': node.end_lineno,
                        'metadata': {
                            'base_classes': [base.id if hasattr(base, 'id') else str(base) for base in node.bases],
                            'decorators': [d.id if hasattr(d, 'id') else str(d) for d in node.decorator_list]
                        }
                    })
            
            imports = []
            module_docstring = ""
            
            for node in tree.body:
                if isinstance(node,(ast.Import,ast.ImportFrom)):
                    imports.append(ast.unparse(node))
                elif isinstance(node,ast.Expr) and isinstance(node.value, ast.Constant):
                    if isinstance(node.value.value, str) and not module_docstring:
                        module_docstring = node.value.value
            
            if imports or module_docstring:
                chunks.append({
                    'type': 'module',
                    'name': file_path,
                    'content': f"# Imports:\n" + '\n'.join(imports) + f"\n\n# Module docstring:\n{module_docstring}",
                    'file_path': file_path,
                    'metadata': {
                        'imports': imports,
                        'docstring': module_docstring
                    }
                })
                
        except SyntaxError:
            return self.generic_chunk(content, file_path)
        
        return chunks
    
    def parse_javascript(self, content: str, file_path: str) -> List[Dict[str, Any]]:
        """Parse JavaScript/TypeScript code into semantic chunks"""
        chunks = []
        
        function_pattern = r'(?:function\s+(\w+)|(\w+)\s*[:=]\s*(?:async\s+)?function|(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?:=>\s*)?{)'
        class_pattern = r'class\s+(\w+)(?:\s+extends\s+\w+)?\s*{'
        
        lines = content.split('\n')
        
        for i, line in enumerate(lines):
            func_match = re.search(function_pattern, line)
            if func_match:
                func_name = func_match.group(1) or func_match.group(2) or func_match.group(3)
                
                # Find function end (simple brace matching)
                brace_count = line.count('{') - line.count('}')
                end_line = i
                
                for j in range(i + 1, len(lines)):
                    brace_count += lines[j].count('{') - lines[j].count('}')
                    if brace_count <= 0:
                        end_line = j
                        break
                
                func_content = '\n'.join(lines[i:end_line + 1])
                
                chunks.append({
                    'type': 'function',
                    'name': func_name,
                    'content': func_content,
                    'file_path': file_path,
                    'line_start': i + 1,
                    'line_end': end_line + 1,
                    'metadata': {}
                })
        
        return chunks if chunks else self.generic_chunk(content, file_path)
    
    def generic_chunk(self, content: str, file_path: str, chunk_size: int = 1000) -> List[Dict[str, Any]]:
        """Generic chunking for non-parseable files"""
        chunks = []
        lines = content.split('\n')
        
        current_chunk = []
        current_size = 0
        
        for i, line in enumerate(lines):
            current_chunk.append(line)
            current_size += len(line)
            
            if current_size >= chunk_size or i == len(lines) - 1:
                chunks.append({
                    'type': 'generic',
                    'name': f"{file_path}_chunk_{len(chunks)}",
                    'content': '\n'.join(current_chunk),
                    'file_path': file_path,
                    'line_start': i - len(current_chunk) + 2,
                    'line_end': i + 1,
                    'metadata': {}
                })
                current_chunk = []
                current_size = 0
        
        return chunks
            
        
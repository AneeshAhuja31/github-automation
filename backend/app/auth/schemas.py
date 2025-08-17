from pydantic import BaseModel

class UserInfo(BaseModel):
    username:str
    name:str
    
class UserGithubInfo(BaseModel):
    username:str
    name:str
    access_token:str

class UserTokenInfo(BaseModel):
    username:str
    name:str
    id:str
    avatar_url:str


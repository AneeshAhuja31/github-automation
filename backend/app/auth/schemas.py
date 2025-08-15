from pydantic import BaseModel

class UserInfo(BaseModel):
    username:str
    name:str

class UserTokenInfo(BaseModel):
    username:str
    name:str
    id:str
    avatar_url:str
    
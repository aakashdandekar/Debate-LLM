from pydantic import BaseModel, EmailStr

class User(BaseModel):
    name: str
    email: EmailStr
    password: str

class Login(BaseModel):
    email: EmailStr
    password: str

class Context_history(BaseModel):
    user_id: str
    active_debate: str
    context: str

class History(BaseModel):
    user_id: str
    history: list[dict]
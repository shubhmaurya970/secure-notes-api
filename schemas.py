from pydantic import BaseModel, EmailStr

class NoteCreate(BaseModel):
    title : str
    description: str | None = None

class UserCreate(BaseModel):
    email : EmailStr
    password : str

class UserLogin(BaseModel):
    email : EmailStr
    password : str

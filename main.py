from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db , engine
from models import Note, Base, User
from schemas import NoteCreate, UserCreate, UserLogin
from security import hash_password, verify_password
from fastapi.middleware.cors import CORSMiddleware
from auth import create_access_token, get_current_user



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # only for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


Base.metadata.create_all(bind=engine)

@app.get("/")
def view(db: Session = Depends(get_db)):
    return {"message" : "Welcome to our notes app : "}


@app.get("/notes")
def get_notes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Note).filter(
        Note.user_id == current_user.id
    ).all()


@app.post("/notes")
def add_notes(
    note: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_note = Note(
        title=note.title,
        description=note.description,
        user_id=current_user.id
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note

@app.delete("/notes/{id}")
def delete_note(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = db.query(Note).filter(
        Note.id == id,
        Note.user_id == current_user.id
    ).first()

    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    db.delete(note)
    db.commit()
    return {"msg": "Note deleted"}


@app.post("/signup")
def signup(user : UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        raise HTTPException(status_code=400, detail= "Email already regsister")
    
    new_user = User(email = user.email, hashed_password= hash_password(user.password))

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return{
        "id": new_user.id,
        "email" : new_user.email
    }

@app.post("/login")
def login(user : UserLogin , db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user: 
        raise HTTPException(status_code=400, detail = "Invalid email or password")
    
    if not verify_password(user.password,db_user.hashed_password):
        raise HTTPException(status_code=400, detail = "Invalid email or password")
    
    data = {"sub": str(db_user.id)} 
    
    access_token = create_access_token(
        data 
    )
    
    return{
        "access_token": access_token,
        "token_type" : "bearer"
    }
    



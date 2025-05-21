from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
from bson import json_util
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'tutor_app')]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Authentication
SECRET_KEY = os.environ.get("SECRET_KEY", "supersecretkey123")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

# Define Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class TutorBase(BaseModel):
    email: EmailStr
    name: str

class TutorCreate(TutorBase):
    password: str
    is_admin: bool = False

class Tutor(TutorBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    is_admin: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class StudentBase(BaseModel):
    name: str
    notes: Optional[str] = None
    lesson_link: Optional[str] = None

class StudentCreate(StudentBase):
    pass

class Student(StudentBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tutor_id: str
    payment_status: bool = False
    homework_status: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LessonBase(BaseModel):
    title: str
    student_id: str
    start_time: datetime
    end_time: datetime
    subject: str
    notes: Optional[str] = None

class LessonCreate(LessonBase):
    pass

class Lesson(LessonBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tutor_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_tutor_by_email(email: str):
    tutor = await db.tutors.find_one({"email": email})
    if tutor:
        return tutor
    return None

async def authenticate_tutor(email: str, password: str):
    tutor = await get_tutor_by_email(email)
    if not tutor:
        return False
    if not verify_password(password, tutor["password"]):
        return False
    return tutor

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_tutor(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except jwt.PyJWTError:
        raise credentials_exception
    tutor = await get_tutor_by_email(email=token_data.email)
    if tutor is None:
        raise credentials_exception
    return tutor

# Authentication routes
@api_router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    tutor = await authenticate_tutor(form_data.username, form_data.password)
    if not tutor:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": tutor["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Tutor routes
@api_router.post("/tutors", response_model=Tutor)
async def create_tutor(tutor: TutorCreate):
    db_tutor = await get_tutor_by_email(tutor.email)
    if db_tutor:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(tutor.password)
    tutor_dict = tutor.dict()
    tutor_dict.pop("password")
    tutor_obj = Tutor(**tutor_dict)
    tutor_dict = tutor_obj.dict()
    tutor_dict["password"] = hashed_password
    result = await db.tutors.insert_one(tutor_dict)
    return tutor_obj

@api_router.get("/tutors/me", response_model=Tutor)
async def read_tutors_me(current_tutor = Depends(get_current_tutor)):
    return Tutor(**{k:v for k,v in current_tutor.items() if k != "password"})

# Student routes
@api_router.post("/students", response_model=Student)
async def create_student(student: StudentCreate, current_tutor = Depends(get_current_tutor)):
    student_obj = Student(**student.dict(), tutor_id=current_tutor["id"])
    result = await db.students.insert_one(student_obj.dict())
    return student_obj

@api_router.get("/students", response_model=List[Student])
async def read_students(current_tutor = Depends(get_current_tutor)):
    students = await db.students.find({"tutor_id": current_tutor["id"]}).to_list(1000)
    return [Student(**student) for student in students]

@api_router.get("/students/{student_id}", response_model=Student)
async def read_student(student_id: str, current_tutor = Depends(get_current_tutor)):
    student = await db.students.find_one({"id": student_id, "tutor_id": current_tutor["id"]})
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return Student(**student)

@api_router.put("/students/{student_id}", response_model=Student)
async def update_student(student_id: str, student: StudentCreate, current_tutor = Depends(get_current_tutor)):
    existing = await db.students.find_one({"id": student_id, "tutor_id": current_tutor["id"]})
    if existing is None:
        raise HTTPException(status_code=404, detail="Student not found")
    
    student_dict = student.dict()
    await db.students.update_one(
        {"id": student_id}, {"$set": student_dict}
    )
    updated = await db.students.find_one({"id": student_id})
    return Student(**updated)

@api_router.delete("/students/{student_id}", response_model=dict)
async def delete_student(student_id: str, current_tutor = Depends(get_current_tutor)):
    existing = await db.students.find_one({"id": student_id, "tutor_id": current_tutor["id"]})
    if existing is None:
        raise HTTPException(status_code=404, detail="Student not found")
    
    await db.students.delete_one({"id": student_id})
    # Also delete associated lessons
    await db.lessons.delete_many({"student_id": student_id})
    return {"status": "success", "message": "Student deleted"}

@api_router.put("/students/{student_id}/payment", response_model=Student)
async def update_payment_status(student_id: str, current_tutor = Depends(get_current_tutor)):
    existing = await db.students.find_one({"id": student_id, "tutor_id": current_tutor["id"]})
    if existing is None:
        raise HTTPException(status_code=404, detail="Student not found")
    
    new_status = not existing.get("payment_status", False)
    
    await db.students.update_one(
        {"id": student_id}, {"$set": {"payment_status": new_status}}
    )
    updated = await db.students.find_one({"id": student_id})
    return Student(**updated)

@api_router.put("/students/{student_id}/homework", response_model=Student)
async def update_homework_status(student_id: str, current_tutor = Depends(get_current_tutor)):
    existing = await db.students.find_one({"id": student_id, "tutor_id": current_tutor["id"]})
    if existing is None:
        raise HTTPException(status_code=404, detail="Student not found")
    
    new_status = not existing.get("homework_status", False)
    
    await db.students.update_one(
        {"id": student_id}, {"$set": {"homework_status": new_status}}
    )
    updated = await db.students.find_one({"id": student_id})
    return Student(**updated)

# Lesson routes
@api_router.post("/lessons", response_model=Lesson)
async def create_lesson(lesson: LessonCreate, current_tutor = Depends(get_current_tutor)):
    # Verify student belongs to tutor
    student = await db.students.find_one({"id": lesson.student_id, "tutor_id": current_tutor["id"]})
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    
    lesson_obj = Lesson(**lesson.dict(), tutor_id=current_tutor["id"])
    result = await db.lessons.insert_one(lesson_obj.dict())
    return lesson_obj

@api_router.get("/lessons", response_model=List[Lesson])
async def read_lessons(current_tutor = Depends(get_current_tutor)):
    lessons = await db.lessons.find({"tutor_id": current_tutor["id"]}).to_list(1000)
    return [Lesson(**lesson) for lesson in lessons]

@api_router.get("/lessons/{lesson_id}", response_model=Lesson)
async def read_lesson(lesson_id: str, current_tutor = Depends(get_current_tutor)):
    lesson = await db.lessons.find_one({"id": lesson_id, "tutor_id": current_tutor["id"]})
    if lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return Lesson(**lesson)

@api_router.put("/lessons/{lesson_id}", response_model=Lesson)
async def update_lesson(lesson_id: str, lesson: LessonCreate, current_tutor = Depends(get_current_tutor)):
    existing = await db.lessons.find_one({"id": lesson_id, "tutor_id": current_tutor["id"]})
    if existing is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Verify student belongs to tutor
    student = await db.students.find_one({"id": lesson.student_id, "tutor_id": current_tutor["id"]})
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    
    lesson_dict = lesson.dict()
    await db.lessons.update_one(
        {"id": lesson_id}, {"$set": lesson_dict}
    )
    updated = await db.lessons.find_one({"id": lesson_id})
    return Lesson(**updated)

@api_router.delete("/lessons/{lesson_id}", response_model=dict)
async def delete_lesson(lesson_id: str, current_tutor = Depends(get_current_tutor)):
    existing = await db.lessons.find_one({"id": lesson_id, "tutor_id": current_tutor["id"]})
    if existing is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    await db.lessons.delete_one({"id": lesson_id})
    return {"status": "success", "message": "Lesson deleted"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

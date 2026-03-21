from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import Optional, List
import os, shutil, uuid

from database import engine, get_db, Base
import models, crud, schemas

Base.metadata.create_all(bind=engine)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="Bursary Allocation System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ── Auth ──────────────────────────────────────────────────────────────────────

@app.post("/login", response_model=schemas.UserOut)
def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    return crud.get_or_create_user(db, data.username)

# ── Applications ──────────────────────────────────────────────────────────────

@app.post("/applications", response_model=schemas.ApplicationOut)
def create_application(data: schemas.ApplicationCreate, user_id: int, db: Session = Depends(get_db)):
    return crud.create_application(db, data, user_id)

@app.get("/applications", response_model=List[schemas.ApplicationOut])
def list_applications(
    user_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return crud.get_applications(db, user_id=user_id, status=status)

@app.get("/applications/{app_id}", response_model=schemas.ApplicationOut)
def get_application(app_id: int, db: Session = Depends(get_db)):
    return crud.get_application(db, app_id)

@app.patch("/applications/{app_id}", response_model=schemas.ApplicationOut)
def update_application(app_id: int, data: schemas.ApplicationUpdate, db: Session = Depends(get_db)):
    return crud.update_application(db, app_id, data)

# ── Documents ─────────────────────────────────────────────────────────────────

@app.post("/documents/{application_id}")
def upload_document(application_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    crud.get_application(db, application_id)  # validate exists
    ext = os.path.splitext(file.filename)[1]
    unique_name = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    doc = crud.create_document(db, application_id, file.filename, file_path)
    return {"id": doc.id, "filename": doc.filename, "url": f"/uploads/{unique_name}"}

# ── Allocations ───────────────────────────────────────────────────────────────

@app.post("/allocations", response_model=schemas.AllocationOut)
def allocate(data: schemas.AllocateRequest, db: Session = Depends(get_db)):
    return crud.allocate_funds(db, data)

# ── Budget ────────────────────────────────────────────────────────────────────

@app.get("/budget", response_model=schemas.BudgetOut)
def get_budget(db: Session = Depends(get_db)):
    return crud.get_budget(db)

@app.put("/budget", response_model=schemas.BudgetOut)
def set_budget(data: schemas.BudgetUpdate, db: Session = Depends(get_db)):
    return crud.update_budget(db, data.total_amount)

# ── Admin ─────────────────────────────────────────────────────────────────────

@app.get("/admin/stats")
def stats(db: Session = Depends(get_db)):
    return crud.get_stats(db)

# ── Seed ──────────────────────────────────────────────────────────────────────

@app.post("/seed")
def seed(db: Session = Depends(get_db)):
    from models import RoleEnum, StatusEnum
    # Users
    admin = crud.get_or_create_user(db, "admin")
    student1 = crud.get_or_create_user(db, "alice")
    student2 = crud.get_or_create_user(db, "bob")

    # Budget
    crud.update_budget(db, 500000.0)

    # Applications
    if not db.query(models.Application).first():
        app1 = crud.create_application(db, schemas.ApplicationCreate(
            full_name="Alice Wanjiru", institution="University of Nairobi",
            course="Computer Science", year_of_study=2,
            annual_income=120000, reason="Single parent household, need financial support"
        ), student1.id)
        crud.update_application(db, app1.id, schemas.ApplicationUpdate(status=StatusEnum.approved))

        app2 = crud.create_application(db, schemas.ApplicationCreate(
            full_name="Bob Otieno", institution="Kenyatta University",
            course="Engineering", year_of_study=3,
            annual_income=80000, reason="Father lost job, struggling to pay fees"
        ), student2.id)
        crud.update_application(db, app2.id, schemas.ApplicationUpdate(status=StatusEnum.under_review))

        crud.create_application(db, schemas.ApplicationCreate(
            full_name="Alice Wanjiru", institution="University of Nairobi",
            course="Computer Science", year_of_study=2,
            annual_income=120000, reason="Second application for next semester"
        ), student1.id)

    return {"message": "Seeded successfully"}

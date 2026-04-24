from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
import os, shutil, uuid, io
import csv

from database import engine, get_db, Base
import models, crud, schemas
from auth import verify_password, create_tokens, decode_token
from dependencies import (
    get_current_user, get_current_user_optional, 
    require_admin, require_committee, require_finance, require_auditor
)
from models import RoleEnum, ApplicationStatus, DisbursementStatus

Base.metadata.create_all(bind=engine)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="Bursary Management System API",
    description="Secure Cloud-Based Bursary Management and Allocation System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# ── Auth ──────────────────────────────────────────────────────────────────────
@app.post("/auth/register", response_model=schemas.Token)
def register(data: schemas.RegisterRequest, db: Session = Depends(get_db)):
    existing = crud.get_user_by_username(db, data.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    if data.email:
        existing_email = crud.get_user_by_email(db, data.email)
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    user = crud.create_user(
        db, username=data.username, email=data.email, 
        password=data.password, full_name=data.full_name
    )
    access_token, refresh_token = create_tokens(user)
    
    crud.audit_log_action(db, user.id, "register", "user", user.id, f"New user registered: {user.username}")
    
    return schemas.Token(access_token=access_token, refresh_token=refresh_token)


@app.post("/auth/login", response_model=schemas.Token)
def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, data.username)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.hashed_password or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="User account is inactive")
    
    access_token, refresh_token = create_tokens(user)
    
    crud.audit_log_action(db, user.id, "login", "user", user.id, f"User logged in: {user.username}")
    
    return schemas.Token(access_token=access_token, refresh_token=refresh_token)


@app.post("/auth/refresh", response_model=schemas.Token)
def refresh_token(data: schemas.RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    user = crud.get_user_by_username(db, payload.get("username"))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    access_token, refresh_token = create_tokens(user)
    return schemas.Token(access_token=access_token, refresh_token=refresh_token)


@app.get("/auth/me", response_model=schemas.UserOut)
def get_current_user_info(current_user = Depends(get_current_user)):
    return current_user


@app.put("/auth/profile", response_model=schemas.UserOut)
def update_profile(data: schemas.UserUpdate, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    user = crud.update_user(db, current_user.id, email=data.email, full_name=data.full_name)
    crud.audit_log_action(db, current_user.id, "update_profile", "user", current_user.id, "Updated profile")
    return user


@app.post("/auth/change-password", response_model=schemas.UserOut)
def change_password(data: schemas.PasswordChange, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.hashed_password:
        raise HTTPException(status_code=400, detail="No password set")
    
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    return crud.change_user_password(db, current_user.id, data.new_password)


# ── Users (Admin) ────────────────────────────────────────────────────────────
@app.get("/users", response_model=dict)
def list_users(
    role: Optional[RoleEnum] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    query = db.query(models.User)
    if role:
        query = query.filter(models.User.role == role)
    
    total = query.count()
    total_pages = (total + page_size - 1) // page_size
    users = query.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": users,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@app.get("/users/{user_id}", response_model=schemas.UserOut)
def get_user(user_id: int, db: Session = Depends(get_db), admin = Depends(require_admin)):
    user = crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ── Applications ──────────────────────────────────────────────────────────────
@app.post("/applications", response_model=schemas.ApplicationOut)
def create_application(data: schemas.ApplicationCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return crud.create_application(db, data, current_user.id)


@app.get("/applications", response_model=dict)
def list_applications(
    user_id: Optional[int] = Query(None),
    status: Optional[ApplicationStatus] = Query(None),
    institution: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    is_student = current_user.role == RoleEnum.student
    effective_user_id = user_id if not is_student else current_user.id
    
    items, total, total_pages = crud.get_applications(db, effective_user_id, status.value if status else None, institution, page, page_size)
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@app.get("/applications/my", response_model=dict)
def my_applications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    items, total, total_pages = crud.get_applications(db, current_user.id, None, None, page, page_size)
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@app.get("/applications/{app_id}", response_model=schemas.ApplicationOut)
def get_application(app_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    app = crud.get_application(db, app_id)
    if current_user.role == RoleEnum.student and app.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return app


@app.put("/applications/{app_id}", response_model=schemas.ApplicationOut)
def update_application(app_id: int, data: schemas.ApplicationUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    app = crud.get_application(db, app_id)
    if current_user.role == RoleEnum.student and app.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return crud.update_application(db, app_id, current_user.id, data)


@app.delete("/applications/{app_id}")
def delete_application(app_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    app = crud.get_application(db, app_id)
    if app.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return crud.delete_application(db, app_id, current_user.id)


@app.post("/applications/{app_id}/submit", response_model=schemas.ApplicationOut)
def submit_application(app_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return crud.submit_application(db, app_id, current_user.id)


# ── Documents ─────────────────────────────────────────────────────────────────
@app.post("/applications/{app_id}/documents")
async def upload_document(
    app_id: int,
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    app = crud.get_application(db, app_id)
    if current_user.role == RoleEnum.student and app.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    ext = os.path.splitext(file.filename)[1] or ".bin"
    unique_name = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)
    
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    doc_data = schemas.DocumentCreate(
        doc_type=doc_type,
        filename=unique_name,
        original_filename=file.filename,
        file_path=file_path,
        file_size=file.size,
        mime_type=file.content_type
    )
    doc = crud.create_document(db, doc_data, app_id)
    crud.audit_log_action(db, current_user.id, "upload_document", "document", doc.id, f"Uploaded {doc_type}")
    
    return {"id": doc.id, "filename": doc.filename, "url": f"/uploads/{unique_name}"}


@app.patch("/documents/{doc_id}", response_model=schemas.DocumentOut)
def verify_document(doc_id: int, data: schemas.DocumentUpdate, db: Session = Depends(get_db), admin = Depends(require_admin)):
    return crud.verify_document(db, doc_id, admin.id, data)


# ── Reviews ───────────────────────────────────────────────────────────────────
@app.post("/applications/{app_id}/reviews", response_model=schemas.ReviewOut)
def create_review(app_id: int, data: schemas.ReviewCreate, db: Session = Depends(get_db), admin = Depends(require_admin)):
    return crud.create_review(db, app_id, admin.id, data)


@app.get("/applications/{app_id}/reviews", response_model=List[schemas.ReviewOut])
def get_reviews(app_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return crud.get_reviews(db, app_id)


# ── Committee Decisions ───────────────────────────────────────────────────────
@app.post("/applications/{app_id}/decisions", response_model=schemas.DecisionOut)
def create_decision(app_id: int, data: schemas.DecisionCreate, db: Session = Depends(get_db), committee = Depends(require_committee)):
    return crud.create_decision(db, app_id, committee.id, data)


@app.get("/applications/{app_id}/decisions", response_model=List[schemas.DecisionOut])
def get_decisions(app_id: int, db: Session = Depends(get_db), committee = Depends(require_committee)):
    return crud.get_decisions(db, app_id)


@app.post("/applications/{app_id}/decisions/finalize", response_model=schemas.ApplicationOut)
def finalize_decision(app_id: int, db: Session = Depends(get_db), admin = Depends(require_admin)):
    return crud.finalize_decision(db, app_id, admin.id)


# ── Awards ────────────────────────────────────────────────────────────────────
@app.post("/applications/{app_id}/award", response_model=schemas.AwardOut)
def create_award(app_id: int, data: schemas.AwardCreate, db: Session = Depends(get_db), finance = Depends(require_finance)):
    return crud.create_award(db, app_id, finance.id, data)


@app.get("/awards", response_model=dict)
def list_awards(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    items, total, total_pages = crud.get_awards(db, page, page_size)
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


# ── Disbursements ────────────────────────────────────────────────────────────
@app.post("/awards/{award_id}/disbursements", response_model=schemas.DisbursementOut)
def create_disbursement(award_id: int, data: schemas.DisbursementCreate, db: Session = Depends(get_db), finance = Depends(require_finance)):
    return crud.create_disbursement(db, award_id, finance.id, data)


@app.get("/disbursements", response_model=dict)
def list_disbursements(
    award_id: Optional[int] = Query(None),
    status: Optional[DisbursementStatus] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    finance_user = Depends(require_finance)
):
    items, total, total_pages = crud.get_disbursements(db, award_id, status, page, page_size)
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@app.patch("/disbursements/{disbursement_id}", response_model=schemas.DisbursementOut)
def update_disbursement(disbursement_id: int, data: schemas.DisbursementUpdate, db: Session = Depends(get_db), finance = Depends(require_finance)):
    return crud.update_disbursement(db, disbursement_id, finance.id, data)


# ── Budget ────────────────────────────────────────────────────────────────────
@app.get("/budget", response_model=schemas.BudgetOut)
def get_budget(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return crud.get_budget(db)


@app.put("/budget", response_model=schemas.BudgetOut)
def set_budget(data: schemas.BudgetUpdate, db: Session = Depends(get_db), admin = Depends(require_admin)):
    return crud.update_budget(db, data.academic_year, data.total_amount)


# ── Dashboard & Stats ────────────────────────────────────────────────────────
@app.get("/admin/stats", response_model=schemas.DashboardStats)
def dashboard_stats(db: Session = Depends(get_db), admin = Depends(require_admin)):
    return crud.get_dashboard_stats(db)


# ── Audit Logs ────────────────────────────────────────────────────────────────
@app.get("/audit-logs", response_model=dict)
def audit_logs(
    user_id: Optional[int] = Query(None),
    entity_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    auditor = Depends(require_auditor)
):
    items, total, total_pages = crud.get_audit_logs(db, user_id, entity_type, page, page_size)
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


# ── Reports ───────────────────────────────────────────────────────────────────
@app.get("/reports/summary")
def report_summary(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    status: Optional[ApplicationStatus] = Query(None),
    institution: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    return crud.generate_report(db, start_date, end_date, status, institution)


@app.get("/reports/export")
def export_csv(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    status: Optional[ApplicationStatus] = Query(None),
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    csv_data = crud.export_applications_csv(db, start_date, end_date, status)
    return StreamingResponse(
        io.StringIO(csv_data),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=applications.csv"}
    )


# ── Seed Data ────────────────────────────────────────────────────────────────
@app.post("/seed")
def seed_data(db: Session = Depends(get_db)):
    from models import RoleEnum, ApplicationStatus, DocumentStatus
    
    def get_or_create(username: str, email: str, password: str, full_name: str, role: RoleEnum):
        existing = crud.get_user_by_username(db, username)
        if existing:
            return existing
        return crud.create_user(db, username, email, password, full_name, role)

    admin_user = get_or_create("admin", "admin@bursary.gov", "admin123", "System Administrator", RoleEnum.admin)
    committee_user = get_or_create("committee", "committee@bursary.gov", "committee123", "Dr. Jane Committee", RoleEnum.committee)
    finance_user = get_or_create("finance", "finance@bursary.gov", "finance123", "Mr. John Finance", RoleEnum.finance)
    auditor_user = get_or_create("auditor", "auditor@bursary.gov", "auditor123", "Ms. Sarah Audit", RoleEnum.auditor)
    
    student1 = get_or_create("alice", "alice@student.edu", "student123", "Alice Wanjiku", RoleEnum.student)
    student2 = get_or_create("bob", "bob@student.edu", "student123", "Bob Otieno", RoleEnum.student)
    student3 = get_or_create("charlie", "charlie@student.edu", "student123", "Charles Kamau", RoleEnum.student)
    
    crud.update_budget(db, "2024-2025", 5000000.0)
    
    app1 = crud.create_application(db, schemas.ApplicationCreate(
        full_name="Alice Wanjiku", email="alice@student.edu", phone="+254712345678",
        id_number="12345678", institution="University of Nairobi", admission_number="UON/2023/001",
        course="Computer Science", year_of_study=2, campus="Main Campus",
        guardian_name="John Wanjiku", guardian_phone="+254723456789",
        annual_income=120000, household_size=5, siblings_in_school=2,
        reason="Single parent household with limited income. Father passed away in 2022.",
        bank_name="KCB", bank_account="1234567890"
    ), student1.id)
    app1 = crud.update_application(db, app1.id, admin_user.id, schemas.ApplicationUpdate(status=ApplicationStatus.submitted))
    
    app2 = crud.create_application(db, schemas.ApplicationCreate(
        full_name="Bob Otieno", email="bob@student.edu", phone="+254798765432",
        id_number="87654321", institution="Kenyatta University", admission_number="KU/2022/045",
        course="Electrical Engineering", year_of_study=3, campus="Ruiru Campus",
        guardian_name="Peter Otieno", guardian_phone="+254745678901",
        annual_income=85000, household_size=4, siblings_in_school=1,
        reason="Father lost job due to company closure. Mother is a small-scale vendor.",
        bank_name="Equity", bank_account="0987654321"
    ), student2.id)
    
    app3 = crud.create_application(db, schemas.ApplicationCreate(
        full_name="Charles Kamau", email="charlie@student.edu", phone="+254723456789",
        id_number="11223344", institution="Moi University", admission_number="MU/2023/089",
        course="Medicine", year_of_study=4, campus="Main Campus",
        guardian_name="George Kamau", guardian_phone="+254789012345",
        annual_income=200000, household_size=6, siblings_in_school=2,
        reason="Large family with multiple dependants. Father has chronic illness.",
        bank_name="Co-operative", bank_account="1122334455"
    ), student3.id)
    
    doc1 = crud.create_document(db, schemas.DocumentCreate(
        doc_type="id", filename="id_alice.pdf", original_filename="national_id_alice.pdf",
        file_path=f"{UPLOAD_DIR}/id_alice.pdf", file_size=1024000, mime_type="application/pdf"
    ), app1.id)
    crud.verify_document(db, doc1.id, admin_user.id, schemas.DocumentUpdate(status=DocumentStatus.verified, verification_notes="ID verified"))
    
    doc2 = crud.create_document(db, schemas.DocumentCreate(
        doc_type="admission", filename="adm_alice.pdf", original_filename="admission_letter_alice.pdf",
        file_path=f"{UPLOAD_DIR}/adm_alice.pdf", file_size=512000, mime_type="application/pdf"
    ), app1.id)
    crud.verify_document(db, doc2.id, admin_user.id, schemas.DocumentUpdate(status=DocumentStatus.verified))
    
    crud.create_review(db, app1.id, admin_user.id, schemas.ReviewCreate(
        completeness_check=True, eligibility_check=True, income_verified=True, institution_verified=True,
        notes="All documents complete. Student meets eligibility criteria.", recommendation="approve"
    ))
    
    crud.create_decision(db, app1.id, committee_user.id, schemas.DecisionCreate(
        decision=models.DecisionType.approve, amount_recommended=80000,
        tuition_amount=60000, upkeep_amount=20000,
        notes="Deserving candidate based on financial need assessment."
    ))
    
    crud.update_application(db, app1.id, admin_user.id, schemas.ApplicationUpdate(status=ApplicationStatus.approved))
    
    crud.create_award(db, app1.id, finance_user.id, schemas.AwardCreate(
        total_amount=80000, tuition_amount=60000, upkeep_amount=20000,
        academic_year="2024-2025", semester="First Semester",
        notes="Full bursary awarded based on committee decision"
    ))
    
    return {"message": "Database seeded successfully"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Bursary Management System"}
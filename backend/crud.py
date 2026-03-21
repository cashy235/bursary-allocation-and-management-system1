from sqlalchemy.orm import Session
from models import User, Application, Document, Allocation, Budget, StatusEnum
from schemas import ApplicationCreate, ApplicationUpdate, AllocateRequest
from fastapi import HTTPException

# --- Auth ---
def get_or_create_user(db: Session, username: str) -> User:
    user = db.query(User).filter(User.username == username).first()
    if not user:
        from models import RoleEnum
        role = RoleEnum.admin if username == "admin" else RoleEnum.student
        user = User(username=username, role=role)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

# --- Applications ---
def create_application(db: Session, data: ApplicationCreate, user_id: int) -> Application:
    app = Application(**data.model_dump(), user_id=user_id)
    db.add(app)
    db.commit()
    db.refresh(app)
    return app

def get_applications(db: Session, user_id: int = None, status: str = None):
    q = db.query(Application)
    if user_id:
        q = q.filter(Application.user_id == user_id)
    if status:
        q = q.filter(Application.status == status)
    return q.order_by(Application.created_at.desc()).all()

def get_application(db: Session, app_id: int) -> Application:
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app

def update_application(db: Session, app_id: int, data: ApplicationUpdate) -> Application:
    app = get_application(db, app_id)
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(app, k, v)
    db.commit()
    db.refresh(app)
    return app

# --- Documents ---
def create_document(db: Session, application_id: int, filename: str, file_path: str) -> Document:
    doc = Document(application_id=application_id, filename=filename, file_path=file_path)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

# --- Allocations ---
def allocate_funds(db: Session, data: AllocateRequest) -> Allocation:
    app = get_application(db, data.application_id)
    if app.status != StatusEnum.approved:
        raise HTTPException(status_code=400, detail="Application must be approved before allocation")

    budget = db.query(Budget).first()
    if not budget:
        raise HTTPException(status_code=400, detail="No budget configured")

    remaining = budget.total_amount - budget.allocated_amount
    if data.amount > remaining:
        raise HTTPException(status_code=400, detail=f"Insufficient budget. Remaining: {remaining}")

    existing = db.query(Allocation).filter(Allocation.application_id == data.application_id).first()
    if existing:
        budget.allocated_amount -= existing.amount
        existing.amount = data.amount
        budget.allocated_amount += data.amount
        db.commit()
        db.refresh(existing)
        return existing

    alloc = Allocation(application_id=data.application_id, amount=data.amount)
    db.add(alloc)
    budget.allocated_amount += data.amount
    app.status = StatusEnum.funded
    db.commit()
    db.refresh(alloc)
    return alloc

# --- Budget ---
def get_budget(db: Session) -> Budget:
    budget = db.query(Budget).first()
    if not budget:
        budget = Budget(total_amount=0.0, allocated_amount=0.0)
        db.add(budget)
        db.commit()
        db.refresh(budget)
    return budget

def update_budget(db: Session, total_amount: float) -> Budget:
    budget = get_budget(db)
    budget.total_amount = total_amount
    db.commit()
    db.refresh(budget)
    return budget

# --- Stats ---
def get_stats(db: Session):
    from sqlalchemy import func
    total = db.query(Application).count()
    by_status = db.query(Application.status, func.count(Application.id)).group_by(Application.status).all()
    budget = get_budget(db)
    return {
        "total_applications": total,
        "by_status": {s: c for s, c in by_status},
        "budget": {"total": budget.total_amount, "allocated": budget.allocated_amount, "remaining": budget.total_amount - budget.allocated_amount}
    }

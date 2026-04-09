from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from models import User, Application, Document, Review, Decision, Award, Disbursement, AuditLog, Budget, RoleEnum, ApplicationStatus, DocumentStatus, DecisionType, DisbursementStatus
from schemas import ApplicationCreate, ApplicationUpdate, DocumentCreate, DocumentUpdate, ReviewCreate, ReviewUpdate, DecisionCreate, DecisionUpdate, AwardCreate, DisbursementCreate, DisbursementUpdate
from auth import get_password_hash
from fastapi import HTTPException
from datetime import datetime


def audit_log_action(db: Session, user_id: int, action: str, entity_type: str, entity_id: int = None, details: str = None):
    log = AuditLog(user_id=user_id, action=action, entity_type=entity_type, entity_id=entity_id, details=details)
    db.add(log)
    db.commit()

# --- Auth ---
def get_user_by_username(db: Session, username: str) -> User:
    return db.query(User).filter(User.username == username).first()

def get_user_by_id(db: Session, user_id: int) -> User:
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> User:
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, username: str, email: str = None, password: str = None, full_name: str = None, role: RoleEnum = RoleEnum.student) -> User:
    hashed_pw = get_password_hash(password) if password else None
    user = User(username=username, email=email, hashed_password=hashed_pw, full_name=full_name, role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def update_user(db: Session, user_id: int, **kwargs) -> User:
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for key, value in kwargs.items():
        if value is not None and hasattr(user, key):
            setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user

def change_user_password(db: Session, user_id: int, new_password: str) -> User:
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    db.refresh(user)
    return user

# --- Applications ---
def create_application(db: Session, data: ApplicationCreate, user_id: int) -> Application:
    app = Application(**data.model_dump(), user_id=user_id, status=ApplicationStatus.draft)
    db.add(app)
    db.commit()
    db.refresh(app)
    audit_log_action(db, user_id, "create", "application", app.id, f"Created application for {data.full_name}")
    return app

def get_applications(db: Session, user_id: int = None, status: str = None, institution: str = None, page: int = 1, page_size: int = 20):
    query = db.query(Application)
    if user_id:
        query = query.filter(Application.user_id == user_id)
    if status:
        query = query.filter(Application.status == status)
    if institution:
        query = query.filter(Application.institution.ilike(f"%{institution}%"))
    
    total = query.count()
    total_pages = (total + page_size - 1) // page_size
    items = query.order_by(Application.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return items, total, total_pages

def get_application(db: Session, app_id: int) -> Application:
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app

def update_application(db: Session, app_id: int, user_id: int, data: ApplicationUpdate) -> Application:
    app = get_application(db, app_id)
    old_status = app.status
    for key, value in data.model_dump(exclude_none=True).items():
        if hasattr(app, key):
            setattr(app, key, value)
    
    if data.status and data.status != old_status:
        app.submitted_at = datetime.utcnow() if data.status == ApplicationStatus.submitted else app.submitted_at
        audit_log_action(db, user_id, "status_change", "application", app.id, f"Status changed from {old_status} to {data.status}")
    
    db.commit()
    db.refresh(app)
    return app

def delete_application(db: Session, app_id: int, user_id: int) -> bool:
    app = get_application(db, app_id)
    if app.status != ApplicationStatus.draft:
        raise HTTPException(status_code=400, detail="Can only delete draft applications")
    audit_log_action(db, user_id, "delete", "application", app.id, f"Deleted application for {app.full_name}")
    db.delete(app)
    db.commit()
    return True

def submit_application(db: Session, app_id: int, user_id: int) -> Application:
    app = get_application(db, app_id)
    if app.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if app.status != ApplicationStatus.draft:
        raise HTTPException(status_code=400, detail="Application already submitted")
    
    app.status = ApplicationStatus.submitted
    app.submitted_at = datetime.utcnow()
    db.commit()
    db.refresh(app)
    audit_log_action(db, user_id, "submit", "application", app.id, "Application submitted")
    return app

# --- Documents ---
def create_document(db: Session, data: DocumentCreate, application_id: int) -> Document:
    app = get_application(db, application_id)
    if app.status not in [ApplicationStatus.draft, ApplicationStatus.submitted]:
        raise HTTPException(status_code=400, detail="Cannot add documents to this application")
    
    doc = Document(**data.model_dump(), application_id=application_id)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

def get_documents(db: Session, application_id: int) -> list:
    return db.query(Document).filter(Document.application_id == application_id).all()

def verify_document(db: Session, doc_id: int, user_id: int, data: DocumentUpdate) -> Document:
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if data.status:
        doc.status = data.status
        doc.verified_by = user_id
        doc.verified_at = datetime.utcnow()
    if data.verification_notes:
        doc.verification_notes = data.verification_notes
    
    db.commit()
    db.refresh(doc)
    audit_log_action(db, user_id, "verify_document", "document", doc.id, f"Document {doc.filename} - {data.status}")
    return doc

# --- Reviews ---
def create_review(db: Session, app_id: int, reviewer_id: int, data: ReviewCreate) -> Review:
    app = get_application(db, app_id)
    review = Review(
        application_id=app_id,
        reviewer_id=reviewer_id,
        completeness_check=data.completeness_check,
        eligibility_check=data.eligibility_check,
        income_verified=data.income_verified,
        institution_verified=data.institution_verified,
        notes=data.notes,
        recommendation=data.recommendation
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    
    if app.status == ApplicationStatus.submitted:
        all_required_docs_verified = all(d.status == DocumentStatus.verified for d in app.documents)
        if all_required_docs_verified:
            app.status = ApplicationStatus.documents_verified
    
    db.commit()
    audit_log_action(db, reviewer_id, "review", "application", app_id, f"Review added - {data.recommendation}")
    return review

def get_reviews(db: Session, app_id: int) -> list:
    return db.query(Review).filter(Review.application_id == app_id).all()

# --- Committee Decisions ---
def create_decision(db: Session, app_id: int, member_id: int, data: DecisionCreate) -> Decision:
    app = get_application(db, app_id)
    
    existing = db.query(Decision).filter(Decision.application_id == app_id, Decision.committee_member_id == member_id).first()
    if existing:
        if data.decision:
            existing.decision = data.decision
        if data.amount_recommended is not None:
            existing.amount_recommended = data.amount_recommended
        if data.tuition_amount is not None:
            existing.tuition_amount = data.tuition_amount
        if data.upkeep_amount is not None:
            existing.upkeep_amount = data.upkeep_amount
        if data.notes:
            existing.notes = data.notes
        db.commit()
        db.refresh(existing)
        return existing
    
    decision = Decision(
        application_id=app_id,
        committee_member_id=member_id,
        decision=data.decision,
        amount_recommended=data.amount_recommended,
        tuition_amount=data.tuition_amount,
        upkeep_amount=data.upkeep_amount,
        notes=data.notes
    )
    db.add(decision)
    db.commit()
    db.refresh(decision)
    audit_log_action(db, member_id, "decision", "application", app_id, f"Decision: {data.decision}")
    return decision

def get_decisions(db: Session, app_id: int) -> list:
    return db.query(Decision).filter(Decision.application_id == app_id).all()

def finalize_decision(db: Session, app_id: int, admin_id: int) -> Application:
    app = get_application(db, app_id)
    decisions = get_decisions(db, app_id)
    
    if not decisions:
        raise HTTPException(status_code=400, detail="No committee decisions yet")
    
    approve_count = sum(1 for d in decisions if d.decision == DecisionType.approve)
    reject_count = sum(1 for d in decisions if d.decision == DecisionType.reject)
    
    if approve_count > reject_count:
        app.status = ApplicationStatus.approved
    elif reject_count > approve_count:
        app.status = ApplicationStatus.rejected
    else:
        app.status = ApplicationStatus.pending_decision
    
    db.commit()
    db.refresh(app)
    audit_log_action(db, admin_id, "finalize_decision", "application", app_id, f"Final decision: {app.status}")
    return app

# --- Awards ---
def create_award(db: Session, app_id: int, user_id: int, data: AwardCreate) -> Award:
    app = get_application(db, app_id)
    if app.status != ApplicationStatus.approved:
        raise HTTPException(status_code=400, detail="Application must be approved before awarding")
    
    budget = get_budget(db)
    remaining = budget.total_amount - budget.allocated_amount
    if data.total_amount > remaining:
        raise HTTPException(status_code=400, detail=f"Insufficient budget. Remaining: {remaining}")
    
    existing = db.query(Award).filter(Award.application_id == app_id).first()
    if existing:
        budget.allocated_amount -= existing.total_amount
        existing.total_amount = data.total_amount
        existing.tuition_amount = data.tuition_amount
        existing.upkeep_amount = data.upkeep_amount
        existing.academic_year = data.academic_year
        existing.semester = data.semester
        existing.notes = data.notes
        budget.allocated_amount += data.total_amount
        db.commit()
        db.refresh(existing)
        return existing
    
    award = Award(
        application_id=app_id,
        total_amount=data.total_amount,
        tuition_amount=data.tuition_amount,
        upkeep_amount=data.upkeep_amount,
        academic_year=data.academic_year,
        semester=data.semester,
        notes=data.notes,
        created_by=user_id
    )
    db.add(award)
    budget.allocated_amount += data.total_amount
    app.status = ApplicationStatus.awarded
    db.commit()
    db.refresh(award)
    audit_log_action(db, user_id, "award", "application", app_id, f"Awarded {data.total_amount}")
    return award

def get_awards(db: Session, page: int = 1, page_size: int = 20):
    query = db.query(Award)
    total = query.count()
    total_pages = (total + page_size - 1) // page_size
    items = query.order_by(Award.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return items, total, total_pages

# --- Disbursements ---
def create_disbursement(db: Session, award_id: int, user_id: int, data: DisbursementCreate) -> Disbursement:
    award = db.query(Award).filter(Award.id == award_id).first()
    if not award:
        raise HTTPException(status_code=404, detail="Award not found")
    
    existing = db.query(Disbursement).filter(Disbursement.award_id == award_id, Disbursement.disbursement_type == data.disbursement_type).first()
    if existing:
        existing.amount = data.amount
        existing.recipient_name = data.recipient_name
        existing.recipient_account = data.recipient_account
        existing.recipient_bank = data.recipient_bank
        existing.notes = data.notes
        db.commit()
        db.refresh(existing)
        return existing
    
    disbursement = Disbursement(
        award_id=award_id,
        disbursement_type=data.disbursement_type,
        amount=data.amount,
        recipient_name=data.recipient_name,
        recipient_account=data.recipient_account,
        recipient_bank=data.recipient_bank,
        transaction_reference=data.transaction_reference,
        payment_date=data.payment_date,
        notes=data.notes,
        created_by=user_id
    )
    db.add(disbursement)
    db.commit()
    db.refresh(disbursement)
    audit_log_action(db, user_id, "create_disbursement", "disbursement", disbursement.id, f"Created {data.disbursement_type} disbursement")
    return disbursement

def update_disbursement(db: Session, disbursement_id: int, user_id: int, data: DisbursementUpdate) -> Disbursement:
    disbursement = db.query(Disbursement).filter(Disbursement.id == disbursement_id).first()
    if not disbursement:
        raise HTTPException(status_code=404, detail="Disbursement not found")
    
    if data.status == DisbursementStatus.paid and disbursement.status != DisbursementStatus.paid:
        disbursement.status = DisbursementStatus.paid
        disbursement.payment_date = datetime.utcnow()
        budget = get_budget(db)
        budget.disbursed_amount += disbursement.amount
        app = disbursement.award.application
        app.status = ApplicationStatus.disbursed
        audit_log_action(db, user_id, "payment", "disbursement", disbursement_id, "Payment marked as paid")
    
    if data.transaction_reference:
        disbursement.transaction_reference = data.transaction_reference
    if data.notes:
        disbursement.notes = data.notes
    
    db.commit()
    db.refresh(disbursement)
    return disbursement

def get_disbursements(db: Session, award_id: int = None, status: DisbursementStatus = None, page: int = 1, page_size: int = 20):
    query = db.query(Disbursement)
    if award_id:
        query = query.filter(Disbursement.award_id == award_id)
    if status:
        query = query.filter(Disbursement.status == status)
    
    total = query.count()
    total_pages = (total + page_size - 1) // page_size
    items = query.order_by(Disbursement.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return items, total, total_pages

# --- Budget ---
def get_budget(db: Session) -> Budget:
    budget = db.query(Budget).first()
    if not budget:
        budget = Budget(total_amount=0.0, allocated_amount=0.0, disbursed_amount=0.0)
        db.add(budget)
        db.commit()
        db.refresh(budget)
    return budget

def update_budget(db: Session, academic_year: str = None, total_amount: float = None) -> Budget:
    budget = get_budget(db)
    if academic_year:
        budget.academic_year = academic_year
    if total_amount is not None:
        budget.total_amount = total_amount
    db.commit()
    db.refresh(budget)
    return budget

# --- Reporting ---
def get_dashboard_stats(db: Session):
    total = db.query(Application).count()
    by_status = db.query(Application.status, func.count(Application.id)).group_by(Application.status).all()
    by_role = db.query(User.role, func.count(User.id)).group_by(User.role).all()
    budget = get_budget(db)
    
    recent = db.query(Application).order_by(Application.created_at.desc()).limit(10).all()
    
    return {
        "total_applications": total,
        "by_status": {s.value: c for s, c in by_status},
        "by_role": {r.value: c for r, c in by_role},
        "budget": {
            "total": budget.total_amount, 
            "allocated": budget.allocated_amount,
            "disbursed": budget.disbursed_amount,
            "remaining": budget.total_amount - budget.allocated_amount
        },
        "recent_applications": recent
    }

def get_audit_logs(db: Session, user_id: int = None, entity_type: str = None, page: int = 1, page_size: int = 50):
    query = db.query(AuditLog)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    
    total = query.count()
    total_pages = (total + page_size - 1) // page_size
    items = query.order_by(AuditLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return items, total, total_pages

def generate_report(db: Session, start_date: datetime = None, end_date: datetime = None, status: ApplicationStatus = None, institution: str = None):
    query = db.query(Application)
    
    if start_date:
        query = query.filter(Application.created_at >= start_date)
    if end_date:
        query = query.filter(Application.created_at <= end_date)
    if status:
        query = query.filter(Application.status == status)
    if institution:
        query = query.filter(Application.institution.ilike(f"%{institution}%"))
    
    apps = query.all()
    
    report = {
        "total": len(apps),
        "by_status": {},
        "by_institution": {},
        "total_requested": sum(a.annual_income for a in apps),
        "approved": len([a for a in apps if a.status == ApplicationStatus.approved]),
        "rejected": len([a for a in apps if a.status == ApplicationStatus.rejected]),
        "pending": len([a for a in apps if a.status in [ApplicationStatus.submitted, ApplicationStatus.under_review, ApplicationStatus.pending_decision]]),
    }
    
    for app in apps:
        status_key = app.status.value
        report["by_status"][status_key] = report["by_status"].get(status_key, 0) + 1
        
        inst_key = app.institution
        report["by_institution"][inst_key] = report["by_institution"].get(inst_key, 0) + 1
    
    return report

def export_applications_csv(db: Session, start_date: datetime = None, end_date: datetime = None, status: ApplicationStatus = None):
    query = db.query(Application)
    
    if start_date:
        query = query.filter(Application.created_at >= start_date)
    if end_date:
        query = query.filter(Application.created_at <= end_date)
    if status:
        query = query.filter(Application.status == status)
    
    apps = query.all()
    
    csv_data = "ID,Full Name,Email,Institution,Course,Year,Status,Annual Income,Created At,Submitted At\n"
    for app in apps:
        csv_data += f"{app.id},{app.full_name},{app.email},{app.institution},{app.course},{app.year_of_study},{app.status.value},{app.annual_income},{app.created_at},{app.submitted_at or ''}\n"
    
    return csv_data
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


class RoleEnum(str, enum.Enum):
    student = "student"
    admin = "admin"
    committee = "committee"
    finance = "finance"
    auditor = "auditor"


class ApplicationStatus(str, enum.Enum):
    draft = "draft"
    submitted = "submitted"
    under_review = "under_review"
    documents_verified = "documents_verified"
    pending_decision = "pending_decision"
    approved = "approved"
    rejected = "rejected"
    awarded = "awarded"
    disbursed = "disbursed"
    closed = "closed"


class DocumentStatus(str, enum.Enum):
    pending = "pending"
    verified = "verified"
    rejected = "rejected"


class DecisionType(str, enum.Enum):
    approve = "approve"
    reject = "reject"
    pending = "pending"


class DisbursementStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"


class DisbursementType(str, enum.Enum):
    tuition = "tuition"
    upkeep = "upkeep"


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=True)
    full_name = Column(String, nullable=True)
    role = Column(Enum(RoleEnum), default=RoleEnum.student)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    applications = relationship("Application", back_populates="user")
    reviews = relationship("Review", back_populates="reviewer")
    decisions = relationship("Decision", back_populates="committee_member")


class Application(Base):
    __tablename__ = "applications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.draft)
    full_name = Column(String)
    email = Column(String)
    phone = Column(String, nullable=True)
    id_number = Column(String, nullable=True)
    institution = Column(String)
    admission_number = Column(String, nullable=True)
    course = Column(String)
    year_of_study = Column(Integer)
    campus = Column(String, nullable=True)
    guardian_name = Column(String, nullable=True)
    guardian_phone = Column(String, nullable=True)
    annual_income = Column(Float)
    household_size = Column(Integer, nullable=True)
    siblings_in_school = Column(Integer, nullable=True)
    reason = Column(Text)
    bank_name = Column(String, nullable=True)
    bank_account = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    user = relationship("User", back_populates="applications")
    documents = relationship("Document", back_populates="application", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="application", cascade="all, delete-orphan")
    decisions = relationship("Decision", back_populates="application", cascade="all, delete-orphan")
    award = relationship("Award", back_populates="application", uselist=False)


class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"))
    doc_type = Column(String)
    filename = Column(String)
    original_filename = Column(String)
    file_path = Column(String)
    file_size = Column(Integer, nullable=True)
    mime_type = Column(String, nullable=True)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.pending)
    verification_notes = Column(Text, nullable=True)
    verified_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    application = relationship("Application", back_populates="documents")


class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"))
    reviewer_id = Column(Integer, ForeignKey("users.id"))
    completeness_check = Column(Boolean, default=False)
    eligibility_check = Column(Boolean, default=False)
    income_verified = Column(Boolean, default=False)
    institution_verified = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    recommendation = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    application = relationship("Application", back_populates="reviews")
    reviewer = relationship("User", back_populates="reviews")


class Decision(Base):
    __tablename__ = "decisions"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"))
    committee_member_id = Column(Integer, ForeignKey("users.id"))
    decision = Column(Enum(DecisionType), default=DecisionType.pending)
    amount_recommended = Column(Float, nullable=True)
    tuition_amount = Column(Float, nullable=True)
    upkeep_amount = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    application = relationship("Application", back_populates="decisions")
    committee_member = relationship("User", back_populates="decisions")


class Award(Base):
    __tablename__ = "awards"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), unique=True)
    total_amount = Column(Float)
    tuition_amount = Column(Float)
    upkeep_amount = Column(Float)
    academic_year = Column(String, nullable=True)
    semester = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    application = relationship("Application", back_populates="award")
    disbursements = relationship("Disbursement", back_populates="award")


class Disbursement(Base):
    __tablename__ = "disbursements"
    id = Column(Integer, primary_key=True, index=True)
    award_id = Column(Integer, ForeignKey("awards.id"))
    disbursement_type = Column(Enum(DisbursementType))
    amount = Column(Float)
    status = Column(Enum(DisbursementStatus), default=DisbursementStatus.pending)
    recipient_name = Column(String, nullable=True)
    recipient_account = Column(String, nullable=True)
    recipient_bank = Column(String, nullable=True)
    transaction_reference = Column(String, nullable=True)
    payment_date = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    award = relationship("Award", back_populates="disbursements")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String)
    entity_type = Column(String)
    entity_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User")


class Budget(Base):
    __tablename__ = "budget"
    id = Column(Integer, primary_key=True, index=True)
    academic_year = Column(String, nullable=True)
    total_amount = Column(Float, default=0.0)
    allocated_amount = Column(Float, default=0.0)
    disbursed_amount = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
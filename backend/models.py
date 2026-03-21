from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class RoleEnum(str, enum.Enum):
    admin = "admin"
    student = "student"

class StatusEnum(str, enum.Enum):
    submitted = "submitted"
    under_review = "under_review"
    approved = "approved"
    rejected = "rejected"
    funded = "funded"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    role = Column(Enum(RoleEnum), default=RoleEnum.student)
    applications = relationship("Application", back_populates="user")

class Application(Base):
    __tablename__ = "applications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    status = Column(Enum(StatusEnum), default=StatusEnum.submitted)
    full_name = Column(String)
    institution = Column(String)
    course = Column(String)
    year_of_study = Column(Integer)
    annual_income = Column(Float)
    reason = Column(Text)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="applications")
    documents = relationship("Document", back_populates="application")
    allocation = relationship("Allocation", back_populates="application", uselist=False)

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"))
    filename = Column(String)
    file_path = Column(String)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    application = relationship("Application", back_populates="documents")

class Allocation(Base):
    __tablename__ = "allocations"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), unique=True)
    amount = Column(Float)
    allocated_at = Column(DateTime(timezone=True), server_default=func.now())
    application = relationship("Application", back_populates="allocation")

class Budget(Base):
    __tablename__ = "budget"
    id = Column(Integer, primary_key=True, index=True)
    total_amount = Column(Float, default=0.0)
    allocated_amount = Column(Float, default=0.0)

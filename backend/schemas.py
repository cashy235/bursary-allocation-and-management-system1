from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from models import RoleEnum, StatusEnum

class LoginRequest(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    role: RoleEnum
    model_config = {"from_attributes": True}

class ApplicationCreate(BaseModel):
    full_name: str
    institution: str
    course: str
    year_of_study: int
    annual_income: float
    reason: str

class ApplicationUpdate(BaseModel):
    status: Optional[StatusEnum] = None
    notes: Optional[str] = None

class DocumentOut(BaseModel):
    id: int
    filename: str
    uploaded_at: datetime
    model_config = {"from_attributes": True}

class AllocationOut(BaseModel):
    id: int
    amount: float
    allocated_at: datetime
    model_config = {"from_attributes": True}

class ApplicationOut(BaseModel):
    id: int
    user_id: int
    status: StatusEnum
    full_name: str
    institution: str
    course: str
    year_of_study: int
    annual_income: float
    reason: str
    notes: Optional[str]
    created_at: datetime
    documents: List[DocumentOut] = []
    allocation: Optional[AllocationOut] = None
    model_config = {"from_attributes": True}

class AllocateRequest(BaseModel):
    application_id: int
    amount: float

class BudgetUpdate(BaseModel):
    total_amount: float

class BudgetOut(BaseModel):
    id: int
    total_amount: float
    allocated_amount: float
    model_config = {"from_attributes": True}

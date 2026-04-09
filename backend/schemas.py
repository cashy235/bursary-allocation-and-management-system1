from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from models import RoleEnum, ApplicationStatus, DocumentStatus, DecisionType, DisbursementStatus, DisbursementType


class TokenData(BaseModel):
    user_id: int
    username: str
    role: RoleEnum


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: Optional[str]
    full_name: Optional[str]
    role: RoleEnum
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


class ApplicationCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    id_number: Optional[str] = None
    institution: str
    admission_number: Optional[str] = None
    course: str
    year_of_study: int = Field(..., ge=1, le=10)
    campus: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    annual_income: float = Field(..., ge=0)
    household_size: Optional[int] = None
    siblings_in_school: Optional[int] = None
    reason: str
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None


class ApplicationUpdate(BaseModel):
    status: Optional[ApplicationStatus] = None
    notes: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    id_number: Optional[str] = None
    institution: Optional[str] = None
    admission_number: Optional[str] = None
    course: Optional[str] = None
    year_of_study: Optional[int] = None
    campus: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    annual_income: Optional[float] = None
    household_size: Optional[int] = None
    siblings_in_school: Optional[int] = None
    reason: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None


class DocumentCreate(BaseModel):
    doc_type: str
    filename: str
    original_filename: str
    file_path: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None


class DocumentUpdate(BaseModel):
    status: Optional[DocumentStatus] = None
    verification_notes: Optional[str] = None


class DocumentOut(BaseModel):
    id: int
    application_id: int
    doc_type: str
    filename: str
    original_filename: str
    file_path: str
    file_size: Optional[int]
    mime_type: Optional[str]
    status: DocumentStatus
    verification_notes: Optional[str]
    verified_by: Optional[int]
    verified_at: Optional[datetime]
    uploaded_at: datetime
    model_config = {"from_attributes": True}


class ReviewCreate(BaseModel):
    completeness_check: bool = False
    eligibility_check: bool = False
    income_verified: bool = False
    institution_verified: bool = False
    notes: Optional[str] = None
    recommendation: Optional[str] = None


class ReviewUpdate(BaseModel):
    completeness_check: Optional[bool] = None
    eligibility_check: Optional[bool] = None
    income_verified: Optional[bool] = None
    institution_verified: Optional[bool] = None
    notes: Optional[str] = None
    recommendation: Optional[str] = None


class ReviewOut(BaseModel):
    id: int
    application_id: int
    reviewer_id: int
    completeness_check: bool
    eligibility_check: bool
    income_verified: bool
    institution_verified: bool
    notes: Optional[str]
    recommendation: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}


class DecisionCreate(BaseModel):
    decision: DecisionType
    amount_recommended: Optional[float] = None
    tuition_amount: Optional[float] = None
    upkeep_amount: Optional[float] = None
    notes: Optional[str] = None


class DecisionUpdate(BaseModel):
    decision: Optional[DecisionType] = None
    amount_recommended: Optional[float] = None
    tuition_amount: Optional[float] = None
    upkeep_amount: Optional[float] = None
    notes: Optional[str] = None


class DecisionOut(BaseModel):
    id: int
    application_id: int
    committee_member_id: int
    decision: DecisionType
    amount_recommended: Optional[float]
    tuition_amount: Optional[float]
    upkeep_amount: Optional[float]
    notes: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}


class AwardCreate(BaseModel):
    total_amount: float
    tuition_amount: float
    upkeep_amount: float
    academic_year: Optional[str] = None
    semester: Optional[str] = None
    notes: Optional[str] = None


class AwardOut(BaseModel):
    id: int
    application_id: int
    total_amount: float
    tuition_amount: float
    upkeep_amount: float
    academic_year: Optional[str]
    semester: Optional[str]
    notes: Optional[str]
    created_by: Optional[int]
    created_at: datetime
    model_config = {"from_attributes": True}


class DisbursementCreate(BaseModel):
    disbursement_type: DisbursementType
    amount: float
    recipient_name: Optional[str] = None
    recipient_account: Optional[str] = None
    recipient_bank: Optional[str] = None
    transaction_reference: Optional[str] = None
    payment_date: Optional[datetime] = None
    notes: Optional[str] = None


class DisbursementUpdate(BaseModel):
    status: Optional[DisbursementStatus] = None
    transaction_reference: Optional[str] = None
    payment_date: Optional[datetime] = None
    notes: Optional[str] = None


class DisbursementOut(BaseModel):
    id: int
    award_id: int
    disbursement_type: DisbursementType
    amount: float
    status: DisbursementStatus
    recipient_name: Optional[str]
    recipient_account: Optional[str]
    recipient_bank: Optional[str]
    transaction_reference: Optional[str]
    payment_date: Optional[datetime]
    notes: Optional[str]
    created_by: Optional[int]
    created_at: datetime
    model_config = {"from_attributes": True}


class ApplicationOut(BaseModel):
    id: int
    user_id: int
    status: ApplicationStatus
    full_name: str
    email: str
    phone: Optional[str]
    id_number: Optional[str]
    institution: str
    admission_number: Optional[str]
    course: str
    year_of_study: int
    campus: Optional[str]
    guardian_name: Optional[str]
    guardian_phone: Optional[str]
    annual_income: float
    household_size: Optional[int]
    siblings_in_school: Optional[int]
    reason: str
    bank_name: Optional[str]
    bank_account: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    submitted_at: Optional[datetime]
    documents: List[DocumentOut] = []
    reviews: List[ReviewOut] = []
    decisions: List[DecisionOut] = []
    award: Optional[AwardOut] = None
    model_config = {"from_attributes": True}


class BudgetUpdate(BaseModel):
    academic_year: Optional[str] = None
    total_amount: float


class BudgetOut(BaseModel):
    id: int
    academic_year: Optional[str]
    total_amount: float
    allocated_amount: float
    disbursed_amount: float
    created_at: datetime
    updated_at: Optional[datetime]
    model_config = {"from_attributes": True}


class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    entity_type: str
    entity_id: Optional[int]
    details: Optional[str]
    ip_address: Optional[str]
    created_at: datetime
    user: Optional[UserOut] = None
    model_config = {"from_attributes": True}


class PaginatedResponse(BaseModel):
    items: List
    total: int
    page: int
    page_size: int
    total_pages: int


class ApplicationListOut(BaseModel):
    id: int
    user_id: int
    status: ApplicationStatus
    full_name: str
    email: str
    institution: str
    course: str
    year_of_study: int
    created_at: datetime
    submitted_at: Optional[datetime]
    model_config = {"from_attributes": True}


class DashboardStats(BaseModel):
    total_applications: int
    by_status: dict
    by_role: dict
    budget: dict
    recent_applications: List[ApplicationListOut] = []


class ReportParams(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[ApplicationStatus] = None
    institution: Optional[str] = None


class ErrorResponse(BaseModel):
    detail: str
    code: Optional[str] = None
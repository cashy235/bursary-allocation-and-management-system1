import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refresh_token: refresh });
          localStorage.setItem("access_token", res.data.access_token);
          localStorage.setItem("refresh_token", res.data.refresh_token);
          error.config.headers.Authorization = `Bearer ${res.data.access_token}`;
          return api.request(error.config);
        } catch {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/";
        }
      }
    }
    return Promise.reject(error);
  }
);

export type Role = "student" | "admin" | "committee" | "finance" | "auditor";

export type ApplicationStatus = 
  | "draft" | "submitted" | "under_review" | "documents_verified" 
  | "pending_decision" | "approved" | "rejected" | "awarded" | "disbursed" | "closed";

export type DocumentStatus = "pending" | "verified" | "rejected";
export type DecisionType = "approve" | "reject" | "pending";
export type DisbursementStatus = "pending" | "paid";
export type DisbursementType = "tuition" | "upkeep";

export interface User {
  id: number;
  username: string;
  email?: string;
  full_name?: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface School {
  id: string;
  name: string;
}

export interface Department {
  id: string;
  name: string;
  school_id: string;
}

export interface Course {
  id: string;
  name: string;
  code?: string;
  department_id: string;
}

export interface Document {
  id: number;
  application_id: number;
  doc_type: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  status: DocumentStatus;
  verification_notes?: string;
  verified_by?: number;
  verified_at?: string;
  uploaded_at: string;
}

export interface Review {
  id: number;
  application_id: number;
  reviewer_id: number;
  completeness_check: boolean;
  eligibility_check: boolean;
  income_verified: boolean;
  institution_verified: boolean;
  notes?: string;
  recommendation?: string;
  created_at: string;
}

export interface Decision {
  id: number;
  application_id: number;
  committee_member_id: number;
  decision: DecisionType;
  amount_recommended?: number;
  tuition_amount?: number;
  upkeep_amount?: number;
  notes?: string;
  created_at: string;
}

export interface Award {
  id: number;
  application_id: number;
  total_amount: number;
  tuition_amount: number;
  upkeep_amount: number;
  academic_year?: string;
  semester?: string;
  notes?: string;
  created_by?: number;
  created_at: string;
}

export interface Disbursement {
  id: number;
  award_id: number;
  disbursement_type: DisbursementType;
  amount: number;
  status: DisbursementStatus;
  recipient_name?: string;
  recipient_account?: string;
  recipient_bank?: string;
  transaction_reference?: string;
  payment_date?: string;
  notes?: string;
  created_by?: number;
  created_at: string;
}

export interface Application {
  id: number;
  user_id: number;
  status: ApplicationStatus;
  full_name: string;
  email: string;
  phone?: string;
  id_number?: string;
  institution: string;
  admission_number?: string;
  course: string;
  year_of_study: number;
  campus?: string;
  guardian_name?: string;
  guardian_phone?: string;
  annual_income: number;
  household_size?: number;
  siblings_in_school?: number;
  reason: string;
  bank_name?: string;
  bank_account?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  submitted_at?: string;
  documents: Document[];
  reviews: Review[];
  decisions: Decision[];
  award?: Award;
}

export interface Budget {
  id: number;
  academic_year?: string;
  total_amount: number;
  allocated_amount: number;
  disbursed_amount: number;
  created_at: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  action: string;
  entity_type: string;
  entity_id?: number;
  details?: string;
  ip_address?: string;
  created_at: string;
  user?: User;
}

// Auth
export const register = (
  username: string,
  email: string,
  password: string,
  fullName?: string,
  role?: Role,
  schoolId?: string,
  departmentId?: string,
  courseId?: string
) =>
  api.post<Token>("/auth/register", {
    username,
    email: email || undefined,
    password,
    full_name: fullName || undefined,
    role: role || "student",
    school_id: schoolId || undefined,
    department_id: departmentId || undefined,
    course_id: courseId || undefined,
  }).then(r => r.data);

export const getSchools = () => api.get<School[]>("/lookups/schools").then(r => r.data);
export const getDepartments = (schoolId?: string) =>
  api.get<Department[]>("/lookups/departments", { params: schoolId ? { school_id: schoolId } : undefined }).then(r => r.data);
export const getCourses = (departmentId?: string) =>
  api.get<Course[]>("/lookups/courses", { params: departmentId ? { department_id: departmentId } : undefined }).then(r => r.data);

export const login = (username: string, password: string) =>
  api.post<Token>("/auth/login", { username, password }).then(r => r.data);

export const refreshToken = (refresh_token: string) =>
  api.post<Token>("/auth/refresh", { refresh_token }).then(r => r.data);

export const getCurrentUser = () => api.get<User>("/auth/me").then(r => r.data);

export const updateProfile = (data: { email?: string; full_name?: string }) =>
  api.put<User>("/auth/profile", data).then(r => r.data);

export const changePassword = (current_password: string, new_password: string) =>
  api.post("/auth/change-password", { current_password, new_password }).then(r => r.data);

// Applications
export const getApplications = (params?: { user_id?: number; status?: ApplicationStatus; institution?: string; page?: number; page_size?: number }) =>
  api.get<PaginatedResponse<Application>>("/applications", { params }).then(r => r.data);

export const getMyApplications = (params?: { page?: number; page_size?: number }) =>
  api.get<PaginatedResponse<Application>>("/applications/my", { params }).then(r => r.data);

export const getApplication = (id: number) =>
  api.get<Application>(`/applications/${id}`).then(r => r.data);

export const createApplication = (data: Partial<Application>) =>
  api.post<Application>("/applications", data).then(r => r.data);

export const updateApplication = (id: number, data: Partial<Application>) =>
  api.put<Application>(`/applications/${id}`, data).then(r => r.data);

export const deleteApplication = (id: number) =>
  api.delete(`/applications/${id}`).then(r => r.data);

export const submitApplication = (id: number) =>
  api.post<Application>(`/applications/${id}/submit`).then(r => r.data);

// Documents
export const uploadDocument = (applicationId: number, docType: string, file: File) => {
  const form = new FormData();
  form.append("doc_type", docType);
  form.append("file", file);
  return api.post(`/applications/${applicationId}/documents`, form).then(r => r.data);
};

export const verifyDocument = (docId: number, status: DocumentStatus, notes?: string) =>
  api.patch<Document>(`/documents/${docId}`, { status, verification_notes: notes }).then(r => r.data);

// Reviews
export const createReview = (appId: number, data: Partial<Review>) =>
  api.post<Review>(`/applications/${appId}/reviews`, data).then(r => r.data);

export const getReviews = (appId: number) =>
  api.get<Review[]>(`/applications/${appId}/reviews`).then(r => r.data);

// Decisions
export const createDecision = (appId: number, data: Partial<Decision>) =>
  api.post<Decision>(`/applications/${appId}/decisions`, data).then(r => r.data);

export const getDecisions = (appId: number) =>
  api.get<Decision[]>(`/applications/${appId}/decisions`).then(r => r.data);

export const finalizeDecision = (appId: number) =>
  api.post<Application>(`/applications/${appId}/decisions/finalize`).then(r => r.data);

// Awards
export const createAward = (appId: number, data: { total_amount: number; tuition_amount: number; upkeep_amount: number; academic_year?: string; semester?: string; notes?: string }) =>
  api.post<Award>(`/applications/${appId}/award`, data).then(r => r.data);

export const getAwards = (params?: { page?: number; page_size?: number }) =>
  api.get<PaginatedResponse<Award>>("/awards", { params }).then(r => r.data);

// Disbursements
export const createDisbursement = (awardId: number, data: { disbursement_type: DisbursementType; amount: number; recipient_name?: string; recipient_account?: string; recipient_bank?: string; transaction_reference?: string; notes?: string }) =>
  api.post<Disbursement>(`/awards/${awardId}/disbursements`, data).then(r => r.data);

export const getDisbursements = (params?: { award_id?: number; status?: DisbursementStatus; page?: number; page_size?: number }) =>
  api.get<PaginatedResponse<Disbursement>>("/disbursements", { params }).then(r => r.data);

export const updateDisbursement = (id: number, data: { status?: DisbursementStatus; transaction_reference?: string; notes?: string }) =>
  api.patch<Disbursement>(`/disbursements/${id}`, data).then(r => r.data);

// Budget
export const getBudget = () => api.get<Budget>("/budget").then(r => r.data);

export const setBudget = (academic_year: string, total_amount: number) =>
  api.put<Budget>("/budget", { academic_year, total_amount }).then(r => r.data);

// Stats
export const getStats = () => api.get("/admin/stats").then(r => r.data);

// Audit
export const getAuditLogs = (params?: { user_id?: number; entity_type?: string; page?: number; page_size?: number }) =>
  api.get<PaginatedResponse<AuditLog>>("/audit-logs", { params }).then(r => r.data);

// Reports
export const getReport = (params?: { start_date?: string; end_date?: string; status?: ApplicationStatus; institution?: string }) =>
  api.get("/reports/summary", { params }).then(r => r.data);

export const exportCSV = (params?: { start_date?: string; end_date?: string; status?: ApplicationStatus }) =>
  api.get("/reports/export", { params, responseType: "blob" as const }).then(r => r.data);

// Users (admin)
export const getUsers = (params?: { role?: Role; page?: number; page_size?: number }) =>
  api.get<PaginatedResponse<User>>("/users", { params }).then(r => r.data);

// Seed
export const seed = () => api.post("/seed").then(r => r.data);

export default api;
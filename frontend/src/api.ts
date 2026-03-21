import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000" });

export type Role = "admin" | "student";
export type Status = "submitted" | "under_review" | "approved" | "rejected" | "funded";

export interface User { id: number; username: string; role: Role; }
export interface Document { id: number; filename: string; uploaded_at: string; }
export interface Allocation { id: number; amount: number; allocated_at: string; }
export interface Application {
  id: number; user_id: number; status: Status;
  full_name: string; institution: string; course: string;
  year_of_study: number; annual_income: number; reason: string;
  notes?: string; created_at: string;
  documents: Document[]; allocation?: Allocation;
}
export interface Budget { id: number; total_amount: number; allocated_amount: number; }

export const login = (username: string, password: string) =>
  api.post<User>("/login", { username, password }).then(r => r.data);

export const getApplications = (params?: { user_id?: number; status?: string }) =>
  api.get<Application[]>("/applications", { params }).then(r => r.data);

export const getApplication = (id: number) =>
  api.get<Application>(`/applications/${id}`).then(r => r.data);

export const createApplication = (user_id: number, data: object) =>
  api.post<Application>(`/applications?user_id=${user_id}`, data).then(r => r.data);

export const updateApplication = (id: number, data: object) =>
  api.patch<Application>(`/applications/${id}`, data).then(r => r.data);

export const uploadDocument = (application_id: number, file: File) => {
  const form = new FormData();
  form.append("file", file);
  return api.post(`/documents/${application_id}`, form).then(r => r.data);
};

export const getBudget = () => api.get<Budget>("/budget").then(r => r.data);
export const setBudget = (total_amount: number) =>
  api.put<Budget>("/budget", { total_amount }).then(r => r.data);

export const allocate = (application_id: number, amount: number) =>
  api.post("/allocations", { application_id, amount }).then(r => r.data);

export const getStats = () => api.get("/admin/stats").then(r => r.data);
export const seed = () => api.post("/seed").then(r => r.data);

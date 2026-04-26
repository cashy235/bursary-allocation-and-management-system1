import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  type Application,
  type ApplicationStatus,
  type AuditLog,
  type Budget,
  type Course,
  type Department,
  type Role,
  type School,
  type User,
  createAward,
  createDecision,
  createApplication,
  getCourses,
  getDepartments,
  getApplications,
  getAuditLogs,
  getBudget,
  getCurrentUser,
  getSchools,
  getReport,
  login,
  register,
  setBudget,
  submitApplication,
  uploadDocument,
  updateApplication,
} from "./api";

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "#6b7280", bg: "#f9fafb" },
  submitted: { label: "Submitted", color: "#2563eb", bg: "#eff6ff" },
  under_review: { label: "Under Review", color: "#d97706", bg: "#fffbeb" },
  documents_verified: { label: "Docs Verified", color: "#7c3aed", bg: "#f5f3ff" },
  pending_decision: { label: "Pending Decision", color: "#ea580c", bg: "#fff7ed" },
  approved: { label: "Approved", color: "#059669", bg: "#ecfdf5" },
  rejected: { label: "Rejected", color: "#dc2626", bg: "#fef2f2" },
  awarded: { label: "Awarded", color: "#0284c7", bg: "#f0f9ff" },
  disbursed: { label: "Disbursed", color: "#16a34a", bg: "#f0fdf4" },
  closed: { label: "Closed", color: "#374151", bg: "#f3f4f6" },
};

const PROGRESS_STEPS: ApplicationStatus[] = ["submitted", "under_review", "approved", "disbursed"];
function getProgress(status: ApplicationStatus) {
  if (status === "rejected") return { pct: 100, isRejected: true };
  const idx = PROGRESS_STEPS.indexOf(status);
  return { pct: idx === -1 ? 0 : Math.round(((idx + 1) / PROGRESS_STEPS.length) * 100), isRejected: false };
}

const fmt = (n: unknown) => `KES ${Number(n ?? 0).toLocaleString()}`;
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
const fileUrl = (path: string) => {
  if (!path) return "#";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.replace(/\\/g, "/");
  const filename = normalized.split("/").pop();
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
  return filename ? `${baseUrl}/uploads/${filename}` : "#";
};

function Badge({ status }: { status: string }) {
  const m = STATUS_META[status] || { label: status, color: "#6b7280", bg: "#f9fafb" };
  return (
    <span
      style={{
        background: m.bg,
        color: m.color,
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: 20,
        letterSpacing: "0.03em",
        textTransform: "uppercase",
        display: "inline-block",
      }}
    >
      {m.label}
    </span>
  );
}

function Avatar({ name, size = 38, color = "#1e40af" }: { name?: string; size?: number; color?: string }) {
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.37,
        fontWeight: 700,
        flexShrink: 0,
        fontFamily: "'Instrument Serif', serif",
      }}
    >
      {initials}
    </div>
  );
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 24, ...style }}>
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent = "#1e40af",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        border: "1px solid #e5e7eb",
        padding: "20px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: accent }} />
      <p
        style={{
          fontSize: 12,
          color: "#6b7280",
          fontWeight: 500,
          marginBottom: 6,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0, fontFamily: "'Instrument Serif', serif" }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  style = {},
  min,
  max,
  rows,
}: {
  label?: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  style?: React.CSSProperties;
  min?: string | number;
  max?: string | number;
  rows?: number;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
          {label}
          {required && <span style={{ color: "#ef4444" }}> *</span>}
        </label>
      )}
      {rows ? (
        <textarea
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          style={{
            width: "100%",
            padding: "10px 14px",
            border: "1.5px solid #d1d5db",
            borderRadius: 10,
            fontSize: 14,
            outline: "none",
            resize: "vertical",
            fontFamily: "inherit",
            boxSizing: "border-box",
            ...style,
          }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          style={{
            width: "100%",
            padding: "10px 14px",
            border: "1.5px solid #d1d5db",
            borderRadius: 10,
            fontSize: 14,
            outline: "none",
            boxSizing: "border-box",
            ...style,
          }}
        />
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 14px",
          border: "1.5px solid #d1d5db",
          borderRadius: 10,
          fontSize: 14,
          background: "#fff",
          cursor: "pointer",
          outline: "none",
          boxSizing: "border-box",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Btn({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled,
  style = {},
  type,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  style?: React.CSSProperties;
  type?: "button" | "submit";
}) {
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: "#1e40af", color: "#fff", border: "none" },
    secondary: { background: "#fff", color: "#374151", border: "1.5px solid #d1d5db" },
    danger: { background: "#dc2626", color: "#fff", border: "none" },
    success: { background: "#059669", color: "#fff", border: "none" },
    ghost: { background: "transparent", color: "#6b7280", border: "none" },
  };
  const sizes: Record<string, React.CSSProperties> = {
    sm: { padding: "6px 14px", fontSize: 13 },
    md: { padding: "10px 20px", fontSize: 14 },
    lg: { padding: "13px 28px", fontSize: 15 },
  };
  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...variants[variant],
        ...sizes[size],
        borderRadius: 10,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        transition: "opacity 0.15s",
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Modal({ title, children, onClose, width = 540 }: { title: string; children: React.ReactNode; onClose: () => void; width?: number }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: width, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 28px", borderBottom: "1px solid #f3f4f6" }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, fontFamily: "'Instrument Serif', serif" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#9ca3af", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "24px 28px" }}>{children}</div>
      </div>
    </div>
  );
}

function TopNav({ user, onLogout, onNav }: { user: User; onLogout: () => void; onNav: (view: View) => void }) {
  const roleColors: Record<Role, string> = { admin: "#7c3aed", committee: "#0284c7", finance: "#059669", auditor: "#d97706", student: "#1e40af" };
  const navItems: Record<Role, Array<{ label: string; view: View }>> = {
    admin: [
      { label: "Dashboard", view: "admin_dash" },
      { label: "Applications", view: "admin_apps" },
      { label: "Budget", view: "budget" },
    ],
    committee: [{ label: "Review Queue", view: "committee_dash" }],
    finance: [{ label: "Finance", view: "finance_dash" }],
    auditor: [
      { label: "Audit Logs", view: "audit_dash" },
      { label: "Reports", view: "reports" },
    ],
    student: [
      { label: "My Dashboard", view: "student_dash" },
      { label: "Apply", view: "apply" },
    ],
  };
  const items = navItems[user.role] || [];
  return (
    <nav style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 32px", display: "flex", alignItems: "center", gap: 0, height: 64, position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 40 }}>
        <div style={{ width: 32, height: 32, background: "#1e40af", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
            <path d="M12 3L1 9l11 6 11-6-11-6z" fill="#fff" />
            <path d="M1 15l11 6 11-6M1 12l11 6 11-6" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
        <span style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 700, fontSize: 17, color: "#111827" }}>BursaryCloud</span>
      </div>
      <div style={{ display: "flex", gap: 4, flex: 1 }}>
        {items.map((i) => (
          <button
            key={i.view}
            onClick={() => onNav(i.view)}
            style={{ background: "none", border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 14, color: "#4b5563", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
          >
            {i.label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar name={user.full_name || user.username} size={34} color={roleColors[user.role]} />
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#111827" }}>{user.full_name || user.username}</p>
          <p style={{ margin: 0, fontSize: 11, color: roleColors[user.role], fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{user.role}</p>
        </div>
        <Btn variant="ghost" size="sm" onClick={onLogout}>
          Logout
        </Btn>
      </div>
    </nav>
  );
}

function AuthScreen({ onLoggedIn }: { onLoggedIn: (u: User) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isReg, setIsReg] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [schools, setSchools] = useState<School[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isReg || role !== "student") return;
    getSchools()
      .then(setSchools)
      .catch(() => setSchools([]));
  }, [isReg, role]);

  useEffect(() => {
    if (!isReg || role !== "student" || !schoolId) {
      setDepartments([]);
      setDepartmentId("");
      setCourses([]);
      setCourseId("");
      return;
    }
    getDepartments(schoolId)
      .then((items) => {
        setDepartments(items);
        setDepartmentId("");
        setCourses([]);
        setCourseId("");
      })
      .catch(() => {
        setDepartments([]);
        setDepartmentId("");
      });
  }, [isReg, role, schoolId]);

  useEffect(() => {
    if (!isReg || role !== "student" || !departmentId) {
      setCourses([]);
      setCourseId("");
      return;
    }
    getCourses(departmentId)
      .then((items) => {
        setCourses(items);
        setCourseId("");
      })
      .catch(() => {
        setCourses([]);
        setCourseId("");
      });
  }, [isReg, role, departmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const tokens = isReg
        ? await register(
            username,
            email,
            password,
            fullName || undefined,
            role,
            role === "student" ? schoolId || undefined : undefined,
            role === "student" ? departmentId || undefined : undefined,
            role === "student" ? courseId || undefined : undefined
          )
        : await login(username, password);
      localStorage.setItem("access_token", tokens.access_token);
      localStorage.setItem("refresh_token", tokens.refresh_token);
      const u = await getCurrentUser();
      onLoggedIn(u);
    } catch (err: unknown) {
      let msg = "Invalid credentials.";
      if (axios.isAxiosError(err)) msg = (err.response?.data?.detail as string) || err.message || msg;
      else if (err instanceof Error) msg = err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f2d4a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(59,130,246,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139,92,246,0.08) 0%, transparent 50%)" }} />
      <div style={{ width: "100%", maxWidth: 440, position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, background: "rgba(255,255,255,0.1)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <path d="M12 3L1 9l11 6 11-6-11-6z" fill="#60a5fa" />
              <path d="M1 15l11 6 11-6M1 12l11 6 11-6" stroke="#60a5fa" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 34, color: "#f8fafc", margin: "0 0 10px", fontWeight: 400, lineHeight: 1.2 }}>BursaryCloud</h1>
          <p style={{ color: "#94a3b8", fontSize: 15, margin: 0 }}>Student Bursary Allocation & Management</p>
        </div>

        <div style={{ background: "#fff", borderRadius: 24, padding: "36px 40px", boxShadow: "0 32px 80px rgba(0,0,0,0.4)" }}>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, margin: "0 0 6px", color: "#111827" }}>{isReg ? "Create Account" : "Welcome back"}</h2>
          <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 28 }}>{isReg ? "Register as a new applicant" : "Sign in to your account"}</p>
          <form onSubmit={handleSubmit}>
            {isReg && <Input label="Full Name" value={fullName} onChange={setFullName} placeholder="John Doe" required />}
            {isReg && <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required />}
            {isReg && (
              <Select
                label="Role"
                value={role}
                onChange={(v) => {
                  const next = v as Role;
                  setRole(next);
                  if (next !== "student") {
                    setSchoolId("");
                    setDepartmentId("");
                    setCourseId("");
                    setSchools([]);
                    setDepartments([]);
                    setCourses([]);
                  }
                }}
                options={[
                  { value: "student", label: "Student / Applicant" },
                  { value: "admin", label: "Admin" },
                  { value: "committee", label: "Committee" },
                  { value: "auditor", label: "Auditor" },
                ]}
              />
            )}
            {isReg && role === "student" && (
              <Select
                label="School"
                value={schoolId}
                onChange={setSchoolId}
                options={[
                  { value: "", label: schools.length ? "Select school" : "No schools found" },
                  ...schools.map((s) => ({ value: s.id, label: s.name })),
                ]}
              />
            )}
            {isReg && role === "student" && (
              <Select
                label="Department"
                value={departmentId}
                onChange={setDepartmentId}
                options={[
                  { value: "", label: schoolId ? (departments.length ? "Select department" : "No departments found") : "Select school first" },
                  ...departments.map((d) => ({ value: d.id, label: d.name })),
                ]}
              />
            )}
            {isReg && role === "student" && (
              <Select
                label="Course"
                value={courseId}
                onChange={setCourseId}
                options={[
                  { value: "", label: departmentId ? (courses.length ? "Select course" : "No courses found") : "Select department first" },
                  ...courses.map((c) => ({ value: c.id, label: c.code ? `${c.name} (${c.code})` : c.name })),
                ]}
              />
            )}
            <Input label="Username" value={username} onChange={setUsername} placeholder="Enter your username" required />
            <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="Enter your password" required />
            {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: 16 }}>{error}</div>}
            <Btn variant="primary" size="lg" disabled={loading} style={{ width: "100%", marginBottom: 16 }} type="submit">
              {loading ? "Signing in…" : isReg ? "Create Account" : "Sign In"}
            </Btn>
          </form>
          <p style={{ textAlign: "center", fontSize: 13, color: "#6b7280", margin: "0 0 16px" }}>
            {isReg ? "Already have an account? " : "Don't have an account? "}
            <button onClick={() => { setIsReg(!isReg); setError(""); }} style={{ background: "none", border: "none", color: "#1e40af", fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
              {isReg ? "Sign in" : "Register"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

type View =
  | "student_dash"
  | "apply"
  | "app_detail"
  | "admin_dash"
  | "admin_apps"
  | "committee_dash"
  | "finance_dash"
  | "budget"
  | "audit_dash"
  | "reports";

function StudentDashboard({ user, apps, onNav }: { user: User; apps: Application[]; onNav: (v: View, id?: number) => void }) {
  const myApps = apps.filter((a) => a.user_id === user.id);
  const stats = useMemo(
    () => ({
      total: myApps.length,
      approved: myApps.filter((a) => ["approved", "awarded", "disbursed"].includes(a.status)).length,
      pending: myApps.filter((a) => ["submitted", "under_review", "pending_decision", "documents_verified"].includes(a.status)).length,
      totalAwarded: myApps.reduce((s, a) => s + (a.award?.total_amount || 0), 0),
    }),
    [myApps]
  );

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 30, margin: "0 0 6px", color: "#111827" }}>My Dashboard</h1>
        <p style={{ color: "#6b7280", fontSize: 15, margin: 0 }}>Track your bursary applications and allocations</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Applications" value={stats.total} accent="#1e40af" />
        <StatCard label="Approved / Awarded" value={stats.approved} accent="#059669" />
        <StatCard label="In Progress" value={stats.pending} accent="#d97706" />
        <StatCard label="Total Awarded" value={fmt(stats.totalAwarded)} accent="#7c3aed" />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, margin: 0, color: "#111827" }}>My Applications</h2>
        <Btn onClick={() => onNav("apply")}>+ New Application</Btn>
      </div>

      {myApps.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 60 }}>
          <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: "#374151", margin: "0 0 10px" }}>No applications yet</h3>
          <p style={{ color: "#6b7280", marginBottom: 20 }}>Submit your first bursary application to get started.</p>
          <Btn onClick={() => onNav("apply")}>Apply for Bursary</Btn>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {myApps.map((app) => {
            const prog = getProgress(app.status);
            return (
              <div key={app.id} style={{ cursor: "pointer" }} onClick={() => onNav("app_detail", app.id)}>
                <Card style={{ transition: "box-shadow 0.2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>{app.institution}</h3>
                        <Badge status={app.status} />
                      </div>
                      <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>{app.course} · Year {app.year_of_study}</p>
                      <p style={{ margin: "4px 0 0", color: "#9ca3af", fontSize: 12 }}>Application #{app.id} · {fmtDate(app.created_at)}</p>
                    </div>
                    {app.award && (
                      <div style={{ textAlign: "right" }}>
                        <p style={{ margin: 0, fontSize: 11, color: "#059669", fontWeight: 600, textTransform: "uppercase" }}>Awarded</p>
                        <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#059669", fontFamily: "'Instrument Serif', serif" }}>{fmt(app.award.total_amount)}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: "#6b7280" }}>Application Progress</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: prog.isRejected ? "#dc2626" : "#1e40af" }}>{prog.pct}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 4, background: "#f3f4f6", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${prog.pct}%`, background: prog.isRejected ? "#dc2626" : "linear-gradient(90deg, #1e40af, #3b82f6)", borderRadius: 4, transition: "width 0.4s" }} />
                    </div>
                  </div>
                  {app.notes && (
                    <div style={{ marginTop: 14, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px" }}>
                      <p style={{ margin: 0, fontSize: 12, color: "#92400e" }}><strong>Reviewer note:</strong> {app.notes}</p>
                    </div>
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ApplicationWizard({ user, onCreated, onCancel }: { user: User; onCreated: (app: Application) => void; onCancel: () => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [feeStructure, setFeeStructure] = useState<File | null>(null);
  const [form, setForm] = useState({
    full_name: user.full_name || "",
    email: user.email || "",
    phone: "",
    id_number: "",
    institution: "",
    admission_number: "",
    course: "",
    year_of_study: "1",
    campus: "",
    guardian_name: "",
    guardian_phone: "",
    annual_income: "",
    household_size: "",
    siblings_in_school: "",
    reason: "",
    bank_name: "",
    bank_account: "",
  });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    let isActive = true;
    const hydrateAcademicFromProfile = async () => {
      if (user.role !== "student") return;
      if (!user.school_id && !user.department_id && !user.course_id) return;
      try {
        const schools = await getSchools();
        const institutionName = schools.find((s) => s.id === user.school_id)?.name;
        let courseName = "";
        if (user.department_id) {
          const courses = await getCourses(user.department_id);
          courseName = courses.find((c) => c.id === user.course_id)?.name || "";
        }
        if (!isActive) return;
        setForm((prev) => ({
          ...prev,
          institution: prev.institution || institutionName || "",
          course: prev.course || courseName || "",
        }));
      } catch {
        // Keep manual entry fallback if lookups fail.
      }
    };
    void hydrateAcademicFromProfile();
    return () => {
      isActive = false;
    };
  }, [user.role, user.school_id, user.department_id, user.course_id]);

  const handleSubmit = async () => {
    if (!form.email) return;
    if (!idDocument || !feeStructure) {
      setError("Upload both National ID and Fee Structure before submitting.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const created = await createApplication({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || undefined,
        id_number: form.id_number || undefined,
        institution: form.institution,
        admission_number: form.admission_number || undefined,
        course: form.course,
        year_of_study: +form.year_of_study,
        campus: form.campus || undefined,
        guardian_name: form.guardian_name || undefined,
        guardian_phone: form.guardian_phone || undefined,
        annual_income: +form.annual_income,
        household_size: form.household_size ? +form.household_size : undefined,
        siblings_in_school: form.siblings_in_school ? +form.siblings_in_school : undefined,
        reason: form.reason,
        bank_name: form.bank_name || undefined,
        bank_account: form.bank_account || undefined,
      });
      await uploadDocument(created.id, "id", idDocument);
      await uploadDocument(created.id, "fee_structure", feeStructure);
      const submitted = await submitApplication(created.id);
      onCreated(submitted);
    } catch (e) {
      setError("Failed to submit application. Please check the documents and try again.");
    } finally {
      setLoading(false);
    }
  };

  const steps = ["Personal Info", "Academic Info", "Financial Info", "Statement"];
  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 32 }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <button onClick={onCancel} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 14, marginBottom: 20, fontFamily: "inherit" }}>← Back to Dashboard</button>
      <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, margin: "0 0 6px", color: "#111827" }}>Bursary Application</h1>
      <p style={{ color: "#6b7280", marginBottom: 32 }}>Academic Year {new Date().getFullYear()}/{new Date().getFullYear() + 1}</p>

      <div style={{ display: "flex", gap: 0, marginBottom: 36, background: "#f9fafb", borderRadius: 12, padding: 6 }}>
        {steps.map((s, i) => (
          <div key={i} onClick={() => i < step && setStep(i + 1)} style={{ flex: 1, textAlign: "center", padding: "10px 8px", borderRadius: 8, background: step === i + 1 ? "#1e40af" : "transparent", cursor: i < step ? "pointer" : "default", transition: "all 0.2s" }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: step === i + 1 ? "#fff" : step > i + 1 ? "#059669" : "#9ca3af" }}>
              {step > i + 1 ? "✓ " : ""}{s}
            </p>
          </div>
        ))}
      </div>

      <Card>
        {step === 1 && (
          <>
            <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 18, margin: "0 0 20px", color: "#111827" }}>Personal Information</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <Input label="Full Name" value={form.full_name} onChange={set("full_name")} required />
              <Input label="Email Address" type="email" value={form.email} onChange={set("email")} required />
              <Input label="Phone Number" value={form.phone} onChange={set("phone")} placeholder="07XXXXXXXX" />
              <Input label="National ID Number" value={form.id_number} onChange={set("id_number")} />
              <Input label="Guardian / Parent Name" value={form.guardian_name} onChange={set("guardian_name")} />
              <Input label="Guardian Phone" value={form.guardian_phone} onChange={set("guardian_phone")} />
            </div>
            <Btn onClick={() => setStep(2)} style={{ marginTop: 8 }}>Continue →</Btn>
          </>
        )}
        {step === 2 && (
          <>
            <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 18, margin: "0 0 20px", color: "#111827" }}>Academic Information</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <Input label="Institution Name" value={form.institution} onChange={set("institution")} required />
              <Input label="Admission Number" value={form.admission_number} onChange={set("admission_number")} />
              <Input label="Course / Programme" value={form.course} onChange={set("course")} required />
              <Input label="Year of Study" type="number" min="1" max="10" value={form.year_of_study} onChange={set("year_of_study")} required />
              <div style={{ gridColumn: "span 2" }}>
                <Input label="Campus" value={form.campus} onChange={set("campus")} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Btn variant="secondary" onClick={() => setStep(1)}>← Back</Btn>
              <Btn onClick={() => setStep(3)}>Continue →</Btn>
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 18, margin: "0 0 20px", color: "#111827" }}>Financial Information</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <div style={{ gridColumn: "span 2" }}>
                <Input label="Annual Household Income (KES)" type="number" value={form.annual_income} onChange={set("annual_income")} required />
              </div>
              <Input label="Household Size" type="number" value={form.household_size} onChange={set("household_size")} />
              <Input label="Siblings in School" type="number" value={form.siblings_in_school} onChange={set("siblings_in_school")} />
              <Input label="Bank Name" value={form.bank_name} onChange={set("bank_name")} />
              <Input label="Account Number" value={form.bank_account} onChange={set("bank_account")} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Btn variant="secondary" onClick={() => setStep(2)}>← Back</Btn>
              <Btn onClick={() => setStep(4)}>Continue →</Btn>
            </div>
          </>
        )}
        {step === 4 && (
          <>
            <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 18, margin: "0 0 20px", color: "#111827" }}>Personal Statement</h3>
            <Input label="Reason for applying" value={form.reason} onChange={set("reason")} rows={7} required style={{ fontFamily: "'Instrument Serif', serif" }} />
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                National ID Document <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setIdDocument(e.target.files?.[0] || null)}
                style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #d1d5db", borderRadius: 10, fontSize: 14 }}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Fee Structure Document <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFeeStructure(e.target.files?.[0] || null)}
                style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #d1d5db", borderRadius: 10, fontSize: 14 }}
              />
            </div>
            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: 16 }}>
                {error}
              </div>
            )}
            <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "14px 18px", marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 13, color: "#0369a1" }}>
                <strong>Declaration:</strong> I declare that all information provided is true and accurate.
              </p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Btn variant="secondary" onClick={() => setStep(3)}>← Back</Btn>
              <Btn onClick={handleSubmit} disabled={loading || !form.reason || !form.email || !form.institution || !form.course || !form.annual_income}>
                {loading ? "Submitting…" : "Submit Application"}
              </Btn>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function AppDetail({ app, user, onBack, onSave, onAward }: { app: Application; user: User; onBack: () => void; onSave: (id: number, updates: Partial<Application>) => Promise<void>; onAward: (id: number, amount: number) => Promise<void> }) {
  const [status, setStatus] = useState<ApplicationStatus>(app.status);
  const [notes, setNotes] = useState(app.notes || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [awardAmount, setAwardAmount] = useState("");
  const canEdit = ["admin", "committee"].includes(user.role);
  const canAward = ["admin", "finance"].includes(user.role);

  useEffect(() => {
    setStatus(app.status);
    setNotes(app.notes || "");
    setMsg("");
    setAwardAmount("");
  }, [app.id, app.status, app.notes]);

  const handleSave = async () => {
    setSaving(true);
    setMsg("");
    await onSave(app.id, { status, notes });
    setMsg("Saved successfully.");
    setSaving(false);
  };

  const handleAward = async () => {
    setSaving(true);
    setMsg("");
    await onAward(app.id, Number(awardAmount));
    setMsg("Award created.");
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: 32 }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 14, marginBottom: 24, fontFamily: "inherit" }}>← Back</button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, margin: "0 0 6px", color: "#111827" }}>{app.full_name}</h1>
          <p style={{ color: "#6b7280", margin: 0 }}>Application #{app.id} · {fmtDate(app.created_at)}</p>
        </div>
        <Badge status={app.status} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <Card>
          <h3 style={{ fontFamily: "'Instrument Serif', serif", margin: "0 0 16px", fontSize: 16, color: "#374151" }}>Academic Details</h3>
          {[
            ["Institution", app.institution],
            ["Course", app.course],
            ["Year of Study", `Year ${app.year_of_study}`],
            ["Campus", app.campus || "N/A"],
            ["Admission No.", app.admission_number || "N/A"],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>{k}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{v}</span>
            </div>
          ))}
        </Card>
        <Card>
          <h3 style={{ fontFamily: "'Instrument Serif', serif", margin: "0 0 16px", fontSize: 16, color: "#374151" }}>Financial Details</h3>
          {[
            ["Annual Income", fmt(app.annual_income)],
            ["Household Size", app.household_size || "N/A"],
            ["Siblings in School", app.siblings_in_school || "N/A"],
            ["Bank", app.bank_name || "N/A"],
            ["Account", app.bank_account || "N/A"],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>{k}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{String(v)}</span>
            </div>
          ))}
        </Card>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Instrument Serif', serif", margin: "0 0 12px", fontSize: 16, color: "#374151" }}>Personal Statement</h3>
        <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, margin: 0 }}>{app.reason}</p>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Instrument Serif', serif", margin: "0 0 16px", fontSize: 16, color: "#374151" }}>Uploaded Documents</h3>
        {!app.documents?.length ? (
          <p style={{ margin: 0, color: "#9ca3af", fontSize: 13 }}>No documents uploaded yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {app.documents.map((doc) => (
              <div
                key={doc.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: "#111827" }}>
                    {doc.doc_type.replace("_", " ").toUpperCase()}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>{doc.original_filename}</p>
                </div>
                <a
                  href={fileUrl(doc.file_path)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: 12,
                    textDecoration: "none",
                    color: "#1e40af",
                    fontWeight: 600,
                    border: "1px solid #bfdbfe",
                    borderRadius: 8,
                    padding: "6px 10px",
                    background: "#eff6ff",
                  }}
                >
                  View
                </a>
              </div>
            ))}
          </div>
        )}
      </Card>

      {app.award && (
        <Card style={{ marginBottom: 20, border: "2px solid #059669" }}>
          <h3 style={{ fontFamily: "'Instrument Serif', serif", margin: "0 0 16px", fontSize: 16, color: "#059669" }}>Bursary Award</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 4px" }}>Total Amount</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: "#059669", fontFamily: "'Instrument Serif', serif", margin: 0 }}>{fmt(app.award.total_amount)}</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 4px" }}>Tuition</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: "#111827", fontFamily: "'Instrument Serif', serif", margin: 0 }}>{fmt(app.award.tuition_amount)}</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 4px" }}>Upkeep</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: "#111827", fontFamily: "'Instrument Serif', serif", margin: 0 }}>{fmt(app.award.upkeep_amount)}</p>
            </div>
          </div>
        </Card>
      )}

      {(canEdit || canAward) && (
        <Card>
          <h3 style={{ fontFamily: "'Instrument Serif', serif", margin: "0 0 16px", fontSize: 16, color: "#374151" }}>Controls</h3>
          {canEdit && (
            <>
              <Select
                label="Update Status"
                value={status}
                onChange={(v) => setStatus(v as ApplicationStatus)}
                options={Object.entries(STATUS_META).map(([v, m]) => ({ value: v, label: m.label }))}
              />
              <Input label="Notes / Comments" value={notes} onChange={setNotes} rows={3} />
              <div style={{ display: "flex", gap: 12 }}>
                <Btn onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Btn>
              </div>
            </>
          )}
          {canAward && app.status === "approved" && (
            <div style={{ marginTop: 18 }}>
              <Input label="Award Amount (KES)" type="number" value={awardAmount} onChange={setAwardAmount} placeholder="e.g. 80000" />
              <Btn variant="success" onClick={handleAward} disabled={saving || !awardAmount}>Create Award</Btn>
            </div>
          )}
          {msg && <p style={{ color: "#059669", fontSize: 13, marginTop: 12 }}>✓ {msg}</p>}
        </Card>
      )}
    </div>
  );
}

function AdminDashboard({ apps, budget, onNav }: { apps: Application[]; budget: Budget | null; onNav: (v: View, id?: number) => void }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("newest");

  const stats = useMemo(
    () => ({
      total: apps.length,
      submitted: apps.filter((a) => a.status === "submitted").length,
      underReview: apps.filter((a) => a.status === "under_review").length,
      approved: apps.filter((a) => ["approved", "awarded", "disbursed"].includes(a.status)).length,
      rejected: apps.filter((a) => a.status === "rejected").length,
      budgetUsed: budget && budget.total_amount ? Math.round((budget.allocated_amount / budget.total_amount) * 100) : 0,
    }),
    [apps, budget]
  );

  const visibleApps = useMemo(() => {
    let list = apps;
    if (statusFilter !== "all") list = list.filter((a) => a.status === statusFilter);
    if (search) {
      const t = search.toLowerCase();
      list = list.filter((a) => a.full_name.toLowerCase().includes(t) || a.institution.toLowerCase().includes(t) || a.course.toLowerCase().includes(t));
    }
    return [...list].sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === "income_low") return a.annual_income - b.annual_income;
      if (sortBy === "income_high") return b.annual_income - a.annual_income;
      return a.full_name.localeCompare(b.full_name);
    });
  }, [apps, statusFilter, search, sortBy]);

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto" }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 30, margin: "0 0 6px", color: "#111827" }}>Admin Dashboard</h1>
        <p style={{ color: "#6b7280", fontSize: 15, margin: 0 }}>Bursary Management System</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14, marginBottom: 28 }}>
        <StatCard label="Total" value={stats.total} accent="#1e40af" />
        <StatCard label="Submitted" value={stats.submitted} accent="#2563eb" />
        <StatCard label="Under Review" value={stats.underReview} accent="#d97706" />
        <StatCard label="Approved" value={stats.approved} accent="#059669" />
        <StatCard label="Rejected" value={stats.rejected} accent="#dc2626" />
        <StatCard label="Budget Used" value={`${stats.budgetUsed}%`} accent="#7c3aed" />
      </div>

      {budget && (
        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: "#111827", fontSize: 15 }}>Budget Overview — {budget.academic_year || "—"}</p>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>Total: {fmt(budget.total_amount)}</p>
            </div>
            <div style={{ display: "flex", gap: 24, textAlign: "right" }}>
              <div><p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>Allocated</p><p style={{ margin: 0, fontWeight: 700, color: "#1e40af", fontSize: 16 }}>{fmt(budget.allocated_amount)}</p></div>
              <div><p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>Disbursed</p><p style={{ margin: 0, fontWeight: 700, color: "#059669", fontSize: 16 }}>{fmt(budget.disbursed_amount)}</p></div>
              <div><p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>Remaining</p><p style={{ margin: 0, fontWeight: 700, color: "#7c3aed", fontSize: 16 }}>{fmt(budget.total_amount - budget.allocated_amount)}</p></div>
            </div>
          </div>
          <div style={{ height: 8, borderRadius: 6, background: "#f3f4f6", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${stats.budgetUsed}%`, background: "linear-gradient(90deg, #1e40af, #3b82f6)", borderRadius: 6 }} />
          </div>
        </Card>
      )}

      <Card style={{ marginBottom: 20, padding: "16px 24px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, institution, course…"
            style={{ flex: 1, minWidth: 220, padding: "9px 14px", border: "1.5px solid #d1d5db", borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "9px 14px", border: "1.5px solid #d1d5db", borderRadius: 10, fontSize: 14, background: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: "9px 14px", border: "1.5px solid #d1d5db", borderRadius: 10, fontSize: 14, background: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="income_low">Income: Low → High</option>
            <option value="income_high">Income: High → Low</option>
            <option value="name">Name A→Z</option>
          </select>
        </div>
      </Card>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
              {["#", "Applicant", "Institution", "Annual Income", "Status", "Date", "Action"].map((h) => (
                <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleApps.map((app, i) => (
              <tr key={app.id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={{ padding: "14px 20px", color: "#9ca3af", fontSize: 13 }}>#{app.id}</td>
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={app.full_name} size={30} color="#1e3a5f" />
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, color: "#111827", fontSize: 14 }}>{app.full_name}</p>
                      <p style={{ margin: 0, color: "#6b7280", fontSize: 12 }}>{app.course}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 20px", color: "#374151" }}>{app.institution}</td>
                <td style={{ padding: "14px 20px", color: "#374151" }}>{fmt(app.annual_income)}</td>
                <td style={{ padding: "14px 20px" }}><Badge status={app.status} /></td>
                <td style={{ padding: "14px 20px", color: "#6b7280", fontSize: 13 }}>{fmtDate(app.created_at)}</td>
                <td style={{ padding: "14px 20px" }}>
                  <Btn size="sm" variant="secondary" onClick={() => onNav("app_detail", app.id)}>Review</Btn>
                </td>
              </tr>
            ))}
            {visibleApps.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>No applications found</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function CommitteeDashboard({
  apps,
  onNav,
  onRecommend,
}: {
  apps: Application[];
  onNav: (v: View, id?: number) => void;
  onRecommend: (appId: number, decision: "approve" | "reject", amount?: number, notes?: string) => Promise<void>;
}) {
  const queue = useMemo(
    () =>
      apps.filter((a) =>
        ["submitted", "under_review", "documents_verified", "pending_decision"].includes(a.status)
      ),
    [apps]
  );
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [decision, setDecision] = useState<"approve" | "reject">("approve");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!queue.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !queue.some((a) => a.id === selectedId)) {
      setSelectedId(queue[0].id);
    }
  }, [queue, selectedId]);

  const selected = selectedId ? queue.find((a) => a.id === selectedId) || null : null;

  const stats = useMemo(
    () => ({
      queue: queue.length,
      needsVerification: queue.filter((a) => ["submitted", "under_review"].includes(a.status)).length,
      pendingDecision: queue.filter((a) => ["documents_verified", "pending_decision"].includes(a.status)).length,
    }),
    [queue]
  );

  const handleRecommend = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await onRecommend(
        selected.id,
        decision,
        decision === "approve" && amount ? Number(amount) : undefined,
        notes || undefined
      );
      setAmount("");
      setNotes("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto" }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 30, margin: "0 0 6px", color: "#111827" }}>Committee Review Board</h1>
        <p style={{ color: "#6b7280", margin: 0 }}>Review verified applicants and submit committee recommendations.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        <StatCard label="In Queue" value={stats.queue} accent="#0284c7" />
        <StatCard label="Needs Initial Review" value={stats.needsVerification} accent="#d97706" />
        <StatCard label="Ready for Decision" value={stats.pendingDecision} accent="#7c3aed" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18 }}>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
            <h3 style={{ margin: 0, fontSize: 16, color: "#111827" }}>Committee Queue</h3>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                {["#", "Applicant", "Status", "Income", "Action"].map((h) => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, color: "#6b7280", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queue.map((app) => (
                <tr key={app.id} style={{ borderBottom: "1px solid #f3f4f6", background: selectedId === app.id ? "#eff6ff" : "#fff" }}>
                  <td style={{ padding: "12px 14px", color: "#9ca3af" }}>#{app.id}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <p style={{ margin: 0, fontWeight: 600, color: "#111827" }}>{app.full_name}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{app.course}</p>
                  </td>
                  <td style={{ padding: "12px 14px" }}><Badge status={app.status} /></td>
                  <td style={{ padding: "12px 14px", color: "#374151" }}>{fmt(app.annual_income)}</td>
                  <td style={{ padding: "12px 14px", display: "flex", gap: 8 }}>
                    <Btn size="sm" variant="secondary" onClick={() => setSelectedId(app.id)}>Select</Btn>
                    <Btn size="sm" variant="ghost" onClick={() => onNav("app_detail", app.id)}>Details</Btn>
                  </td>
                </tr>
              ))}
              {queue.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 36, textAlign: "center", color: "#9ca3af" }}>No applications currently in committee queue.</td></tr>
              )}
            </tbody>
          </table>
        </Card>

        <Card>
          <h3 style={{ margin: "0 0 14px", fontFamily: "'Instrument Serif', serif", fontSize: 20, color: "#111827" }}>Recommendation</h3>
          {!selected ? (
            <p style={{ margin: 0, color: "#6b7280" }}>Select an application from the queue to submit a recommendation.</p>
          ) : (
            <>
              <div style={{ marginBottom: 12 }}>
                <p style={{ margin: "0 0 4px", fontSize: 12, color: "#6b7280" }}>Selected Applicant</p>
                <p style={{ margin: 0, fontWeight: 700, color: "#111827" }}>{selected.full_name}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>{selected.institution}</p>
              </div>
              <Select
                label="Decision"
                value={decision}
                onChange={(v) => setDecision(v as "approve" | "reject")}
                options={[
                  { value: "approve", label: "Approve" },
                  { value: "reject", label: "Reject" },
                ]}
              />
              {decision === "approve" && (
                <Input
                  label="Recommended Amount (KES)"
                  type="number"
                  value={amount}
                  onChange={setAmount}
                  placeholder="e.g. 65000"
                />
              )}
              <Input label="Committee Notes" value={notes} onChange={setNotes} rows={4} placeholder="Reasoning for this recommendation..." />
              <Btn onClick={() => void handleRecommend()} disabled={saving || (decision === "approve" && !amount)}>
                {saving ? "Submitting…" : "Submit Recommendation"}
              </Btn>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function FinanceDashboard({ budget, awards, onSaveBudget }: { budget: Budget | null; awards: Application[]; onSaveBudget: (academicYear: string, total: number) => Promise<void> }) {
  const [showModal, setShowModal] = useState(false);
  const [year, setYear] = useState(budget?.academic_year || "");
  const [total, setTotal] = useState(String(budget?.total_amount ?? 0));

  useEffect(() => {
    setYear(budget?.academic_year || "");
    setTotal(String(budget?.total_amount ?? 0));
  }, [budget?.academic_year, budget?.total_amount]);

  return (
    <div style={{ padding: 32, maxWidth: 1000, margin: "0 auto" }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 30, margin: "0 0 6px", color: "#111827" }}>Finance & Disbursement</h1>
          <p style={{ color: "#6b7280", margin: 0 }}>Budget management and awards tracking</p>
        </div>
        <Btn onClick={() => setShowModal(true)}>Set Budget</Btn>
      </div>

      {budget && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
            <StatCard label="Total Budget" value={fmt(budget.total_amount)} accent="#1e40af" />
            <StatCard label="Allocated" value={fmt(budget.allocated_amount)} accent="#7c3aed" />
            <StatCard label="Disbursed" value={fmt(budget.disbursed_amount)} accent="#059669" />
            <StatCard label="Remaining" value={fmt(budget.total_amount - budget.allocated_amount)} accent="#d97706" />
          </div>
        </>
      )}

      <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, margin: "0 0 16px", color: "#111827" }}>Awards Issued</h2>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
              {["Applicant", "Institution", "Tuition", "Upkeep", "Total", "Academic Year"].map((h) => (
                <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {awards.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>No awards yet</td></tr>
            ) : (
              awards.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "14px 20px", fontWeight: 600, color: "#111827" }}>{a.full_name}</td>
                  <td style={{ padding: "14px 20px", color: "#374151" }}>{a.institution}</td>
                  <td style={{ padding: "14px 20px", color: "#1e40af", fontWeight: 600 }}>{fmt(a.award?.tuition_amount)}</td>
                  <td style={{ padding: "14px 20px" }}>{fmt(a.award?.upkeep_amount)}</td>
                  <td style={{ padding: "14px 20px", fontWeight: 700, color: "#059669" }}>{fmt(a.award?.total_amount)}</td>
                  <td style={{ padding: "14px 20px", color: "#6b7280" }}>{a.award?.academic_year || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {showModal && (
        <Modal title="Update Budget" onClose={() => setShowModal(false)}>
          <Input label="Academic Year" value={year} onChange={setYear} placeholder="e.g. 2024-2025" />
          <Input label="Total Budget Amount (KES)" type="number" value={total} onChange={setTotal} />
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <Btn
              onClick={async () => {
                await onSaveBudget(year || "2024-2025", Number(total || 0));
                setShowModal(false);
              }}
            >
              Save Budget
            </Btn>
            <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AuditorDashboard({ logs, report }: { logs: AuditLog[]; report: any }) {
  const [tab, setTab] = useState<"logs" | "reports">("logs");
  const [filterEntity, setFilterEntity] = useState("");
  const filtered = filterEntity ? logs.filter((l) => l.entity_type === filterEntity) : logs;
  return (
    <div style={{ padding: 32, maxWidth: 1000, margin: "0 auto" }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 30, margin: "0 0 6px", color: "#111827" }}>Audit & Reports</h1>
      <p style={{ color: "#6b7280", marginBottom: 32 }}>System audit trail and analytics</p>

      <div style={{ display: "flex", gap: 6, marginBottom: 28, background: "#f9fafb", borderRadius: 12, padding: 6, width: "fit-content" }}>
        {(["logs", "reports"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: tab === t ? "#1e40af" : "transparent", color: tab === t ? "#fff" : "#6b7280", fontWeight: 600, cursor: "pointer", fontSize: 14, fontFamily: "inherit", textTransform: "capitalize" }}
          >
            {t === "logs" ? "Audit Logs" : "Reports & Analytics"}
          </button>
        ))}
      </div>

      {tab === "logs" && (
        <>
          <Card style={{ marginBottom: 20, padding: "14px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>Filter by entity:</span>
              <select value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)}
                style={{ padding: "7px 12px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 13, background: "#fff", fontFamily: "inherit" }}>
                <option value="">All</option>
                {["application", "decision", "disbursement", "budget", "user", "document"].map((e) => (
                  <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
                ))}
              </select>
            </div>
          </Card>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                  {["#", "User", "Action", "Entity", "Details", "Timestamp"].map((h) => (
                    <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "12px 20px", color: "#9ca3af" }}>{log.id}</td>
                    <td style={{ padding: "12px 20px", fontWeight: 600 }}>{log.user?.username || "System"}</td>
                    <td style={{ padding: "12px 20px" }}>{log.action}</td>
                    <td style={{ padding: "12px 20px", textTransform: "capitalize", color: "#374151" }}>{log.entity_type}</td>
                    <td style={{ padding: "12px 20px", color: "#6b7280", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.details}</td>
                    <td style={{ padding: "12px 20px", color: "#6b7280" }}>{fmtDate(log.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {tab === "reports" && (
        <div>
          {!report ? (
            <Card><p style={{ margin: 0, color: "#6b7280" }}>No report loaded.</p></Card>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
                <StatCard label="Total Applications" value={report.total} accent="#1e40af" />
                <StatCard label="Approved" value={report.approved} accent="#059669" />
                <StatCard label="Rejected" value={report.rejected} accent="#dc2626" />
              </div>
              <Card>
                <h3 style={{ fontFamily: "'Instrument Serif', serif", margin: "0 0 16px", fontSize: 16, color: "#374151" }}>By Status</h3>
                {Object.entries(report.by_status || {}).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
                    <span style={{ fontSize: 13, color: "#6b7280", textTransform: "capitalize" }}>{k.replace("_", " ")}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{String(v)}</span>
                  </div>
                ))}
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function BsmngtApp() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>("student_dash");
  const [apps, setApps] = useState<Application[]>([]);
  const [budget, setBudgetState] = useState<Budget | null>(null);
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [report, setReportState] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3000);
  };

  const loadCore = async (u: User) => {
    const [appsRes, bud] = await Promise.all([
      getApplications({ page_size: 100 }),
      getBudget().catch(() => null),
    ]);
    setApps(appsRes.items);
    setBudgetState(bud);
    if (u.role === "auditor") {
      const logsRes = await getAuditLogs({ page: 1, page_size: 100 });
      setAuditLogs(logsRes.items);
      const rep = await getReport();
      setReportState(rep);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    getCurrentUser()
      .then((u) => {
        setUser(u);
        const defaultViewByRole: Record<Role, View> = {
          admin: "admin_dash",
          committee: "committee_dash",
          finance: "finance_dash",
          auditor: "audit_dash",
          student: "student_dash",
        };
        setView(defaultViewByRole[u.role]);
        loadCore(u).catch(() => {});
      })
      .catch(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      });
  }, []);

  const handleLoggedIn = async (u: User) => {
    setUser(u);
    const defaultViewByRole: Record<Role, View> = {
      admin: "admin_dash",
      committee: "committee_dash",
      finance: "finance_dash",
      auditor: "audit_dash",
      student: "student_dash",
    };
    setView(defaultViewByRole[u.role]);
    await loadCore(u);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    setApps([]);
    setBudgetState(null);
    setSelectedAppId(null);
    setAuditLogs([]);
    setReportState(null);
  };

  const navTo = (v: View, id?: number) => {
    if (typeof id === "number") setSelectedAppId(id);
    setView(v);
  };

  const reloadApps = async () => {
    setSyncing(true);
    try {
      const res = await getApplications({ page_size: 100 });
      setApps(res.items);
      setLastSyncedAt(new Date());
    } finally {
      setSyncing(false);
    }
  };

  const onSaveApp = async (id: number, updates: Partial<Application>) => {
    await updateApplication(id, updates);
    await reloadApps();
    showToast("Application updated.");
  };

  const onCreateApp = async (created: Application) => {
    // Optimistic update then sync to ensure admin views reflect immediately.
    setApps((prev) => [created, ...prev]);
    void reloadApps();
    showToast("Application submitted successfully!");
    setView("student_dash");
  };

  const onAward = async (appId: number, amount: number) => {
    await createAward(appId, {
      total_amount: amount,
      tuition_amount: Math.round(amount * 0.75),
      upkeep_amount: Math.round(amount * 0.25),
    });
    await reloadApps();
    showToast("Award created.");
  };

  const onCommitteeRecommend = async (
    appId: number,
    decision: "approve" | "reject",
    amount?: number,
    notes?: string
  ) => {
    await createDecision(appId, {
      decision,
      amount_recommended: amount,
      tuition_amount: amount ? Math.round(amount * 0.75) : undefined,
      upkeep_amount: amount ? Math.round(amount * 0.25) : undefined,
      notes,
    });
    await reloadApps();
    showToast("Committee recommendation submitted.");
  };

  const onSaveBudget = async (academicYear: string, total: number) => {
    await setBudget(academicYear, total);
    const bud = await getBudget();
    setBudgetState(bud);
    showToast("Budget updated successfully!");
  };

  const selectedApp = selectedAppId ? apps.find((a) => a.id === selectedAppId) || null : null;

  if (!user) return <AuthScreen onLoggedIn={handleLoggedIn} />;

  const main = (() => {
    if (view === "apply") return <ApplicationWizard user={user} onCreated={onCreateApp} onCancel={() => setView("student_dash")} />;
    if (view === "app_detail" && selectedApp) return <AppDetail app={selectedApp} user={user} onBack={() => setView(user.role === "admin" ? "admin_dash" : "student_dash")} onSave={onSaveApp} onAward={onAward} />;

    if (view === "student_dash") return <StudentDashboard user={user} apps={apps} onNav={navTo} />;
    if (view === "admin_dash" || view === "admin_apps") return <AdminDashboard apps={apps} budget={budget} onNav={navTo} />;
    if (view === "committee_dash") return <CommitteeDashboard apps={apps} onNav={navTo} onRecommend={onCommitteeRecommend} />;
    if (view === "finance_dash" || view === "budget") return <FinanceDashboard budget={budget} awards={apps.filter((a) => !!a.award)} onSaveBudget={onSaveBudget} />;
    if (view === "audit_dash" || view === "reports") return <AuditorDashboard logs={auditLogs} report={report} />;
    return <StudentDashboard user={user} apps={apps} onNav={navTo} />;
  })();

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <TopNav user={user} onLogout={handleLogout} onNav={(v) => { navTo(v); void reloadApps(); }} />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "10px 32px 0" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
          {lastSyncedAt && (
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              Last updated {lastSyncedAt.toLocaleTimeString()}
            </span>
          )}
          <Btn variant="secondary" size="sm" onClick={() => void reloadApps()} disabled={syncing}>
            {syncing ? "Refreshing…" : "Refresh"}
          </Btn>
        </div>
      </div>
      <main>{main}</main>
      {toast && (
        <div style={{ position: "fixed", bottom: 32, right: 32, background: toast.type === "success" ? "#059669" : "#dc2626", color: "#fff", padding: "14px 22px", borderRadius: 12, fontSize: 14, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", zIndex: 1000 }}>
          ✓ {toast.msg}
        </div>
      )}
    </div>
  );
}


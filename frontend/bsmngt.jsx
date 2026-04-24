import { useState, useEffect, useMemo } from "react";

// ─── MOCK DATA ──────────────────────────────────────────────────────────────
const MOCK_USERS = [
  { id: 1, username: "admin", password: "admin123", role: "admin", full_name: "System Administrator", email: "admin@bursary.go.ke" },
  { id: 2, username: "committee", password: "comm123", role: "committee", full_name: "Grace Wambui", email: "committee@bursary.go.ke" },
  { id: 3, username: "finance", password: "fin123", role: "finance", full_name: "David Kamau", email: "finance@bursary.go.ke" },
  { id: 4, username: "auditor", password: "aud123", role: "auditor", full_name: "Amina Hassan", email: "auditor@bursary.go.ke" },
  { id: 5, username: "student", password: "std123", role: "student", full_name: "James Otieno", email: "james.otieno@student.ac.ke" },
];

const INITIAL_APPS = [
  { id: 1, user_id: 5, full_name: "James Otieno", email: "james@uni.ac.ke", phone: "0712345678", id_number: "12345678", institution: "University of Nairobi", admission_number: "UON/2022/001", course: "Bachelor of Commerce", year_of_study: 2, campus: "Main", guardian_name: "Mary Otieno", guardian_phone: "0723456789", annual_income: 48000, household_size: 5, siblings_in_school: 2, reason: "My family relies on subsistence farming and the recent drought has severely affected our income. I am a dedicated student maintaining a GPA of 3.8 but face difficulty meeting tuition and upkeep costs.", bank_name: "Equity Bank", bank_account: "0123456789", status: "under_review", created_at: "2025-01-15T09:00:00Z", documents: [{ id: 1, doc_type: "income_proof", filename: "income_cert.pdf", status: "verified" }, { id: 2, doc_type: "admission_letter", filename: "admission.pdf", status: "pending" }], reviews: [], decisions: [], notes: "Initial review completed. Income verified." },
  { id: 2, user_id: 5, full_name: "Faith Njeri", email: "faith@uni.ac.ke", phone: "0734567890", id_number: "23456789", institution: "Kenyatta University", admission_number: "KU/2023/045", course: "Bachelor of Education", year_of_study: 1, campus: "Kahawa", guardian_name: "Peter Njeri", guardian_phone: "0745678901", annual_income: 36000, household_size: 7, siblings_in_school: 4, reason: "Single parent household with seven dependents. Father passed away last year and mother works as a casual labourer. Education is our family's only path out of poverty.", bank_name: "KCB Bank", bank_account: "1234567890", status: "approved", created_at: "2025-01-10T08:00:00Z", documents: [{ id: 3, doc_type: "death_certificate", filename: "death_cert.pdf", status: "verified" }, { id: 4, doc_type: "income_proof", filename: "income_cert.pdf", status: "verified" }], reviews: [{ id: 1, completeness_check: true, eligibility_check: true, income_verified: true, recommendation: "Highly recommended" }], decisions: [{ id: 1, decision: "approve", amount_recommended: 85000, tuition_amount: 65000, upkeep_amount: 20000, notes: "Approved unanimously" }], notes: "All documents verified. Approved for full bursary.", award: { id: 1, total_amount: 85000, tuition_amount: 65000, upkeep_amount: 20000, academic_year: "2024/2025", semester: "Semester 1" } },
  { id: 3, user_id: 5, full_name: "Brian Mwangi", email: "brian@college.ac.ke", phone: "0756789012", id_number: "34567890", institution: "Technical University of Kenya", admission_number: "TUK/2021/089", course: "Diploma in Electrical Engineering", year_of_study: 3, campus: "Nairobi CBD", guardian_name: "John Mwangi", guardian_phone: "0767890123", annual_income: 72000, household_size: 4, siblings_in_school: 1, reason: "Father recently lost his formal employment due to company downsizing. We have depleted our savings and cannot afford the remaining semesters.", bank_name: "Cooperative Bank", bank_account: "2345678901", status: "submitted", created_at: "2025-01-20T10:00:00Z", documents: [{ id: 5, doc_type: "recommendation", filename: "recommendation.pdf", status: "pending" }], reviews: [], decisions: [], notes: "" },
  { id: 4, user_id: 5, full_name: "Aisha Wekesa", email: "aisha@moi.ac.ke", phone: "0778901234", id_number: "45678901", institution: "Moi University", admission_number: "MU/2022/123", course: "Bachelor of Science in Nursing", year_of_study: 2, campus: "Main Campus", guardian_name: "Ibrahim Wekesa", guardian_phone: "0789012345", annual_income: 24000, household_size: 8, siblings_in_school: 5, reason: "Orphan raised by elderly grandparents who depend on government pension. The bursary will allow me to complete my nursing degree and serve rural communities.", bank_name: "M-Pesa", bank_account: "0778901234", status: "funded", created_at: "2025-01-05T07:00:00Z", documents: [{ id: 6, doc_type: "orphan_declaration", filename: "orphan_cert.pdf", status: "verified" }, { id: 7, doc_type: "income_proof", filename: "pension_proof.pdf", status: "verified" }], reviews: [{ id: 2, completeness_check: true, eligibility_check: true, income_verified: true, recommendation: "Priority case" }], decisions: [{ id: 2, decision: "approve", amount_recommended: 95000, tuition_amount: 70000, upkeep_amount: 25000 }], notes: "Priority case - orphan. Disbursement completed.", award: { id: 2, total_amount: 95000, tuition_amount: 70000, upkeep_amount: 25000, academic_year: "2024/2025", semester: "Semester 1" } },
  { id: 5, user_id: 5, full_name: "Samuel Kiprotich", email: "samuel@egerton.ac.ke", phone: "0790123456", id_number: "56789012", institution: "Egerton University", admission_number: "EU/2020/200", course: "Bachelor of Agriculture", year_of_study: 4, campus: "Njoro", guardian_name: "Lydia Kiprotich", guardian_phone: "0701234567", annual_income: 96000, household_size: 3, siblings_in_school: 0, reason: "Seeking supplementary support for final year research project costs which are not covered by the standard bursary.", bank_name: "Stanbic Bank", bank_account: "3456789012", status: "rejected", created_at: "2024-12-20T06:00:00Z", documents: [{ id: 8, doc_type: "income_proof", filename: "payslip.pdf", status: "verified" }], reviews: [{ id: 3, completeness_check: true, eligibility_check: false, income_verified: true, recommendation: "Income exceeds threshold" }], decisions: [{ id: 3, decision: "reject", notes: "Household income above eligibility threshold of KES 80,000 per annum" }], notes: "Income exceeds eligibility threshold." },
];

const INITIAL_BUDGET = { id: 1, academic_year: "2024/2025", total_amount: 5000000, allocated_amount: 180000, disbursed_amount: 95000 };

const AUDIT_LOGS = [
  { id: 1, user: { username: "admin" }, action: "STATUS_UPDATE", entity_type: "application", entity_id: 1, details: "Status changed from submitted to under_review", created_at: "2025-01-16T10:30:00Z" },
  { id: 2, user: { username: "committee" }, action: "DECISION_MADE", entity_type: "decision", entity_id: 1, details: "Application #2 approved with KES 85,000", created_at: "2025-01-14T14:20:00Z" },
  { id: 3, user: { username: "finance" }, action: "DISBURSEMENT", entity_type: "disbursement", entity_id: 1, details: "Tuition KES 70,000 disbursed to Aisha Wekesa", created_at: "2025-01-08T09:00:00Z" },
  { id: 4, user: { username: "admin" }, action: "BUDGET_UPDATE", entity_type: "budget", entity_id: 1, details: "Total budget set to KES 5,000,000 for 2024/2025", created_at: "2025-01-02T08:00:00Z" },
  { id: 5, user: { username: "student" }, action: "APPLICATION_SUBMIT", entity_type: "application", entity_id: 3, details: "Brian Mwangi submitted new application", created_at: "2025-01-20T10:05:00Z" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const STATUS_META = {
  submitted: { label: "Submitted", color: "#2563eb", bg: "#eff6ff" },
  under_review: { label: "Under Review", color: "#d97706", bg: "#fffbeb" },
  documents_verified: { label: "Docs Verified", color: "#7c3aed", bg: "#f5f3ff" },
  pending_decision: { label: "Pending Decision", color: "#ea580c", bg: "#fff7ed" },
  approved: { label: "Approved", color: "#059669", bg: "#ecfdf5" },
  rejected: { label: "Rejected", color: "#dc2626", bg: "#fef2f2" },
  awarded: { label: "Awarded", color: "#0284c7", bg: "#f0f9ff" },
  funded: { label: "Funded", color: "#16a34a", bg: "#f0fdf4" },
  draft: { label: "Draft", color: "#6b7280", bg: "#f9fafb" },
};

const PROGRESS_STEPS = ["submitted", "under_review", "approved", "funded"];
const getProgress = (status) => {
  if (status === "rejected") return { pct: 100, isRejected: true };
  const idx = PROGRESS_STEPS.indexOf(status);
  return { pct: idx === -1 ? 0 : Math.round(((idx + 1) / PROGRESS_STEPS.length) * 100), isRejected: false };
};

const fmt = (n) => `KES ${Number(n).toLocaleString()}`;
const fmtDate = (d) => new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const m = STATUS_META[status] || { label: status, color: "#6b7280", bg: "#f9fafb" };
  return (
    <span style={{ background: m.bg, color: m.color, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, letterSpacing: "0.03em", textTransform: "uppercase", display: "inline-block" }}>
      {m.label}
    </span>
  );
};

const Avatar = ({ name, size = 38, color = "#1e40af" }) => {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.37, fontWeight: 700, flexShrink: 0, fontFamily: "'Instrument Serif', serif" }}>
      {initials}
    </div>
  );
};

const Card = ({ children, style = {} }) => (
  <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: "24px", ...style }}>
    {children}
  </div>
);

const StatCard = ({ label, value, sub, accent = "#1e40af" }) => (
  <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "20px 24px", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: accent, borderRadius: "14px 0 0 14px" }} />
    <p style={{ fontSize: 12, color: "#6b7280", fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
    <p style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0, fontFamily: "'Instrument Serif', serif" }}>{value}</p>
    {sub && <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{sub}</p>}
  </div>
);

const Input = ({ label, type = "text", value, onChange, placeholder, required, style = {}, min, max, rows }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{label}{required && <span style={{ color: "#ef4444" }}> *</span>}</label>}
    {rows ? (
      <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
        style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #d1d5db", borderRadius: 10, fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", ...style }} />
    ) : (
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required} min={min} max={max}
        style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #d1d5db", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", ...style }} />
    )}
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{label}</label>}
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #d1d5db", borderRadius: 10, fontSize: 14, background: "#fff", cursor: "pointer", outline: "none", boxSizing: "border-box" }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Btn = ({ children, onClick, variant = "primary", size = "md", disabled, style = {} }) => {
  const variants = {
    primary: { background: "#1e40af", color: "#fff", border: "none" },
    secondary: { background: "#fff", color: "#374151", border: "1.5px solid #d1d5db" },
    danger: { background: "#dc2626", color: "#fff", border: "none" },
    success: { background: "#059669", color: "#fff", border: "none" },
    ghost: { background: "transparent", color: "#6b7280", border: "none" },
  };
  const sizes = { sm: { padding: "6px 14px", fontSize: 13 }, md: { padding: "10px 20px", fontSize: 14 }, lg: { padding: "13px 28px", fontSize: 15 } };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...variants[variant], ...sizes[size], borderRadius: 10, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "opacity 0.15s", opacity: disabled ? 0.6 : 1, ...style }}>
      {children}
    </button>
  );
};

const Modal = ({ title, children, onClose, width = 540 }) => (
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

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
const Navbar = ({ user, onLogout, onNav }) => {
  const roleColors = { admin: "#7c3aed", committee: "#0284c7", finance: "#059669", auditor: "#d97706", student: "#1e40af" };
  const navItems = {
    admin: [{ label: "Dashboard", view: "admin_dash" }, { label: "Applications", view: "admin_apps" }, { label: "Budget", view: "budget" }, { label: "Users", view: "users" }],
    committee: [{ label: "Review Queue", view: "committee_dash" }],
    finance: [{ label: "Finance", view: "finance_dash" }],
    auditor: [{ label: "Audit Logs", view: "audit_dash" }, { label: "Reports", view: "reports" }],
    student: [{ label: "My Dashboard", view: "student_dash" }, { label: "Apply", view: "apply" }],
  };
  const items = navItems[user?.role] || [];
  return (
    <nav style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 32px", display: "flex", alignItems: "center", gap: 0, height: 64, position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 40 }}>
        <div style={{ width: 32, height: 32, background: "#1e40af", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M12 3L1 9l11 6 11-6-11-6z" fill="#fff" /><path d="M1 15l11 6 11-6M1 12l11 6 11-6" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" fill="none" /></svg>
        </div>
        <span style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 700, fontSize: 17, color: "#111827" }}>BursaryCloud</span>
      </div>
      <div style={{ display: "flex", gap: 4, flex: 1 }}>
        {items.map(i => (
          <button key={i.view} onClick={() => onNav(i.view)}
            style={{ background: "none", border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 14, color: "#4b5563", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>
            {i.label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar name={user?.full_name} size={34} color={roleColors[user?.role]} />
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#111827" }}>{user?.full_name}</p>
          <p style={{ margin: 0, fontSize: 11, color: roleColors[user?.role], fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{user?.role}</p>
        </div>
        <Btn variant="ghost" size="sm" onClick={onLogout}>Logout</Btn>
      </div>
    </nav>
  );
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isReg, setIsReg] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    await new Promise(r => setTimeout(r, 600));
    const user = MOCK_USERS.find(u => u.username === username && u.password === password);
    if (user) { onLogin(user); }
    else { setError("Invalid credentials. Try: admin/admin123, student/std123"); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f2d4a 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(59,130,246,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139,92,246,0.08) 0%, transparent 50%)" }} />

      <div style={{ width: "100%", maxWidth: 440, position: "relative" }}>
        {/* Hero text */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, background: "rgba(255,255,255,0.1)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M12 3L1 9l11 6 11-6-11-6z" fill="#60a5fa" /><path d="M1 15l11 6 11-6M1 12l11 6 11-6" stroke="#60a5fa" strokeWidth="1.5" strokeLinejoin="round" fill="none" /></svg>
          </div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 34, color: "#f8fafc", margin: "0 0 10px", fontWeight: 400, lineHeight: 1.2 }}>BursaryCloud</h1>
          <p style={{ color: "#94a3b8", fontSize: 15, margin: 0 }}>Student Bursary Allocation & Management</p>
        </div>

        {/* Card */}
        <div style={{ background: "#fff", borderRadius: 24, padding: "36px 40px", boxShadow: "0 32px 80px rgba(0,0,0,0.4)" }}>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, margin: "0 0 6px", color: "#111827" }}>{isReg ? "Create Account" : "Welcome back"}</h2>
          <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 28 }}>{isReg ? "Register as a new applicant" : "Sign in to your account"}</p>

          <form onSubmit={handleSubmit}>
            {isReg && <Input label="Full Name" value={fullName} onChange={setFullName} placeholder="John Doe" required />}
            {isReg && <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required />}
            <Input label="Username" value={username} onChange={setUsername} placeholder="Enter your username" required />
            <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="Enter your password" required />

            {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: 16 }}>{error}</div>}

            <Btn variant="primary" size="lg" disabled={loading} style={{ width: "100%", marginBottom: 16 }}>
              {loading ? "Signing in…" : isReg ? "Create Account" : "Sign In"}
            </Btn>
          </form>

          <p style={{ textAlign: "center", fontSize: 13, color: "#6b7280", margin: "0 0 16px" }}>
            {isReg ? "Already have an account? " : "Don't have an account? "}
            <button onClick={() => { setIsReg(!isReg); setError(""); }} style={{ background: "none", border: "none", color: "#1e40af", fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
              {isReg ? "Sign in" : "Register"}
            </button>
          </p>

          <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 16px", fontSize: 12, color: "#6b7280" }}>
            <p style={{ margin: "0 0 4px", fontWeight: 600 }}>Demo credentials:</p>
            <p style={{ margin: 0 }}>admin / admin123 · student / std123 · finance / fin123 · committee / comm123 · auditor / aud123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── STUDENT DASHBOARD ────────────────────────────────────────────────────────
const StudentDashboard = ({ user, apps, onNav }) => {
  const myApps = apps.filter(a => a.user_id === user.id || user.role !== "student");
  const stats = useMemo(() => ({
    total: myApps.length,
    approved: myApps.filter(a => ["approved", "funded"].includes(a.status)).length,
    pending: myApps.filter(a => ["submitted", "under_review"].includes(a.status)).length,
    totalAwarded: myApps.reduce((s, a) => s + (a.award?.total_amount || 0), 0),
  }), [myApps]);

  return (
    <div style={{ padding: "32px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 30, margin: "0 0 6px", color: "#111827" }}>My Dashboard</h1>
        <p style={{ color: "#6b7280", fontSize: 15, margin: 0 }}>Track your bursary applications and allocations</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Applications" value={stats.total} accent="#1e40af" />
        <StatCard label="Approved / Funded" value={stats.approved} accent="#059669" />
        <StatCard label="Under Review" value={stats.pending} accent="#d97706" />
        <StatCard label="Total Awarded" value={fmt(stats.totalAwarded)} accent="#7c3aed" />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, margin: 0, color: "#111827" }}>My Applications</h2>
        <Btn onClick={() => onNav("apply")}>+ New Application</Btn>
      </div>

      {myApps.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 60 }}>
          <p style={{ fontSize: 48, margin: "0 0 16px" }}>📋</p>
          <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: "#374151", margin: "0 0 10px" }}>No applications yet</h3>
          <p style={{ color: "#6b7280", marginBottom: 20 }}>Submit your first bursary application to get started.</p>
          <Btn onClick={() => onNav("apply")}>Apply for Bursary</Btn>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {myApps.map(app => {
            const prog = getProgress(app.status);
            return (
              <Card key={app.id} style={{ cursor: "pointer", transition: "box-shadow 0.2s" }} onClick={() => onNav("app_detail", app.id)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>{app.institution}</h3>
                      <Badge status={app.status} />
                    </div>
                    <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>{app.course} · Year {app.year_of_study}</p>
                    <p style={{ margin: "4px 0 0", color: "#9ca3af", fontSize: 12 }}>Application #{app.id} · Submitted {fmtDate(app.created_at)}</p>
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
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── APPLICATION FORM ─────────────────────────────────────────────────────────
const ApplicationForm = ({ user, onSubmit, onCancel }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    full_name: user?.full_name || "", email: user?.email || "", phone: "", id_number: "",
    institution: "", admission_number: "", course: "", year_of_study: "1", campus: "",
    guardian_name: "", guardian_phone: "",
    annual_income: "", household_size: "", siblings_in_school: "",
    reason: "", bank_name: "", bank_account: ""
  });
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const newApp = {
      id: Date.now(), user_id: user.id, status: "submitted",
      ...form, year_of_study: +form.year_of_study, annual_income: +form.annual_income,
      household_size: +form.household_size, siblings_in_school: +form.siblings_in_school,
      created_at: new Date().toISOString(), documents: [], reviews: [], decisions: [], notes: ""
    };
    onSubmit(newApp);
    setLoading(false);
  };

  const steps = ["Personal Info", "Academic Info", "Financial Info", "Statement"];

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 32 }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <button onClick={onCancel} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 14, marginBottom: 20, fontFamily: "inherit" }}>← Back to Dashboard</button>
      <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, margin: "0 0 6px", color: "#111827" }}>Bursary Application</h1>
      <p style={{ color: "#6b7280", marginBottom: 32 }}>Academic Year 2024/2025</p>

      {/* Step indicator */}
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
              <Input label="Year of Study" type="number" min="1" max="6" value={form.year_of_study} onChange={set("year_of_study")} required />
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
            <Input label="Reason for applying (describe your financial need and academic goals)" value={form.reason} onChange={set("reason")} rows={7} required
              style={{ fontFamily: "'Instrument Serif', serif" }} />

            <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "14px 18px", marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 13, color: "#0369a1" }}>
                <strong>Declaration:</strong> I declare that all information provided is true and accurate. I understand that false information will lead to disqualification.
              </p>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <Btn variant="secondary" onClick={() => setStep(3)}>← Back</Btn>
              <Btn onClick={handleSubmit} disabled={loading || !form.reason}>
                {loading ? "Submitting…" : "Submit Application"}
              </Btn>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

// ─── APPLICATION DETAIL ───────────────────────────────────────────────────────
const AppDetail = ({ app, user, onBack, onUpdate }) => {
  const [status, setStatus] = useState(app.status);
  const [notes, setNotes] = useState(app.notes || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const canEdit = ["admin", "committee"].includes(user.role);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    onUpdate(app.id, { status, notes });
    setMsg("Saved successfully.");
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: 32 }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 14, marginBottom: 24, fontFamily: "inherit" }}>← Back</button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, margin: "0 0 6px", color: "#111827" }}>{app.full_name}</h1>
          <p style={{ color: "#6b7280", margin: 0 }}>Application #{app.id} · Submitted {fmtDate(app.created_at)}</p>
        </div>
        <Badge status={app.status} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* Academic */}
        <Card>
          <h3 style={{ fontFamily: "'Instrument Serif', serif", margin: "0 0 16px", fontSize: 16, color: "#374151" }}>Academic Details</h3>
          {[["Institution", app.institution], ["Course", app.course], ["Year of Study", `Year ${app.year_of_study}`], ["Campus", app.campus || "N/A"], ["Admission No.", app.admission_number || "N/A"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>{k}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{v}</span>
            </div>
          ))}
        </Card>

        {/* Financial */}
        <Card>
          <h3 style={{ fontFamily: "'Instrument Serif', serif", margin: "0 0 16px", fontSize: 16, color: "#374151" }}>Financial Details</h3>
          {[["Annual Income", fmt(app.annual_income)], ["Household Size", app.household_size || "N/A"], ["Siblings in School", app.siblings_in_school || "N/A"], ["Bank", app.bank_name || "N/A"], ["Account", app.bank_account || "N/A"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>{k}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{v}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* Reason */}
      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Instrument Serif', serif", margin: "0 0 12px", fontSize: 16, color: "#374151" }}>Personal Statement</h3>
        <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, margin: 0 }}>{app.reason}</p>
      </Card>

      {/* Documents */}
      {app.documents.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <h3 style={{ fontFamily: "'Instrument Serif', serif", margin: "0 0 12px", fontSize: 16, color: "#374151" }}>Supporting Documents</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {app.documents.map(doc => (
              <div key={doc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#6b7280" strokeWidth="2" /><path d="M14 2v6h6" stroke="#6b7280" strokeWidth="2" /></svg>
                  <span style={{ fontSize: 13, color: "#374151" }}>{doc.filename}</span>
                  <span style={{ fontSize: 11, color: "#6b7280", textTransform: "capitalize" }}>({doc.doc_type.replace("_", " ")})</span>
                </div>
                <Badge status={doc.status === "verified" ? "approved" : doc.status === "rejected" ? "rejected" : "submitted"} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Award */}
      {app.award && (
        <Card style={{ marginBottom: 20, border: "2px solid #059669" }}>
          <h3 style={{ fontFamily: "'Instrument Serif', serif", margin: "0 0 16px", fontSize: 16, color: "#059669" }}>Bursary Award</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            <div style={{ textAlign: "center" }}><p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 4px" }}>Total Amount</p><p style={{ fontSize: 22, fontWeight: 800, color: "#059669", fontFamily: "'Instrument Serif', serif", margin: 0 }}>{fmt(app.award.total_amount)}</p></div>
            <div style={{ textAlign: "center" }}><p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 4px" }}>Tuition</p><p style={{ fontSize: 18, fontWeight: 700, color: "#111827", fontFamily: "'Instrument Serif', serif", margin: 0 }}>{fmt(app.award.tuition_amount)}</p></div>
            <div style={{ textAlign: "center" }}><p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 4px" }}>Upkeep</p><p style={{ fontSize: 18, fontWeight: 700, color: "#111827", fontFamily: "'Instrument Serif', serif", margin: 0 }}>{fmt(app.award.upkeep_amount)}</p></div>
          </div>
        </Card>
      )}

      {/* Admin controls */}
      {canEdit && (
        <Card>
          <h3 style={{ fontFamily: "'Instrument Serif', serif", margin: "0 0 16px", fontSize: 16, color: "#374151" }}>Review Controls</h3>
          <Select label="Update Status" value={status} onChange={setStatus}
            options={Object.entries(STATUS_META).map(([v, m]) => ({ value: v, label: m.label }))} />
          <Input label="Notes / Comments" value={notes} onChange={setNotes} rows={3} />
          {msg && <p style={{ color: "#059669", fontSize: 13, marginBottom: 12 }}>✓ {msg}</p>}
          <Btn onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Btn>
        </Card>
      )}
    </div>
  );
};

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
const AdminDashboard = ({ apps, budget, onNav, onUpdateApp }) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const stats = useMemo(() => ({
    total: apps.length,
    submitted: apps.filter(a => a.status === "submitted").length,
    underReview: apps.filter(a => a.status === "under_review").length,
    approved: apps.filter(a => ["approved", "funded"].includes(a.status)).length,
    rejected: apps.filter(a => a.status === "rejected").length,
    budgetUsed: budget ? Math.round((budget.allocated_amount / budget.total_amount) * 100) : 0,
  }), [apps, budget]);

  const visibleApps = useMemo(() => {
    let list = apps;
    if (statusFilter !== "all") list = list.filter(a => a.status === statusFilter);
    if (search) {
      const t = search.toLowerCase();
      list = list.filter(a => a.full_name.toLowerCase().includes(t) || a.institution.toLowerCase().includes(t) || a.course.toLowerCase().includes(t));
    }
    return [...list].sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === "oldest") return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === "income_low") return a.annual_income - b.annual_income;
      if (sortBy === "income_high") return b.annual_income - a.annual_income;
      return a.full_name.localeCompare(b.full_name);
    });
  }, [apps, statusFilter, search, sortBy]);

  return (
    <div style={{ padding: "32px", maxWidth: 1100, margin: "0 auto" }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 30, margin: "0 0 6px", color: "#111827" }}>Admin Dashboard</h1>
        <p style={{ color: "#6b7280", fontSize: 15, margin: 0 }}>Bursary Management System · Academic Year 2024/2025</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14, marginBottom: 28 }}>
        <StatCard label="Total" value={stats.total} accent="#1e40af" />
        <StatCard label="Submitted" value={stats.submitted} accent="#2563eb" />
        <StatCard label="Under Review" value={stats.underReview} accent="#d97706" />
        <StatCard label="Approved" value={stats.approved} accent="#059669" />
        <StatCard label="Rejected" value={stats.rejected} accent="#dc2626" />
        <StatCard label="Budget Used" value={`${stats.budgetUsed}%`} accent="#7c3aed" />
      </div>

      {/* Budget bar */}
      {budget && (
        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: "#111827", fontSize: 15 }}>Budget Overview — {budget.academic_year}</p>
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

      {/* Filters */}
      <Card style={{ marginBottom: 20, padding: "16px 24px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, institution, course…"
            style={{ flex: 1, minWidth: 220, padding: "9px 14px", border: "1.5px solid #d1d5db", borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: "9px 14px", border: "1.5px solid #d1d5db", borderRadius: 10, fontSize: 14, background: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ padding: "9px 14px", border: "1.5px solid #d1d5db", borderRadius: 10, fontSize: 14, background: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="income_low">Income: Low → High</option>
            <option value="income_high">Income: High → Low</option>
            <option value="name">Name A→Z</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
              {["#", "Applicant", "Institution", "Annual Income", "Status", "Date", "Action"].map(h => (
                <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
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
              <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>No applications found</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// ─── COMMITTEE DASHBOARD ──────────────────────────────────────────────────────
const CommitteeDashboard = ({ apps, onNav }) => {
  const pending = apps.filter(a => ["submitted", "under_review", "pending_decision", "documents_verified"].includes(a.status));
  const recentDecisions = apps.filter(a => a.decisions.length > 0).slice(0, 5);

  return (
    <div style={{ padding: "32px", maxWidth: 1000, margin: "0 auto" }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 30, margin: "0 0 6px", color: "#111827" }}>Committee Review</h1>
      <p style={{ color: "#6b7280", marginBottom: 32 }}>Applications pending committee decision</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        <StatCard label="Pending Review" value={pending.length} accent="#d97706" />
        <StatCard label="Decisions Made" value={recentDecisions.length} accent="#059669" />
        <StatCard label="Total Applications" value={apps.length} accent="#1e40af" />
      </div>

      {pending.length > 0 && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "14px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <p style={{ margin: 0, color: "#92400e", fontWeight: 600 }}>{pending.length} application{pending.length > 1 ? "s" : ""} awaiting committee decision</p>
        </div>
      )}

      <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, margin: "0 0 16px", color: "#111827" }}>Applications Requiring Review</h2>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
              {["#", "Applicant", "Institution", "Income", "Status", "Action"].map(h => (
                <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {apps.map(app => (
              <tr key={app.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "14px 20px", color: "#9ca3af" }}>#{app.id}</td>
                <td style={{ padding: "14px 20px", fontWeight: 600, color: "#111827" }}>{app.full_name}</td>
                <td style={{ padding: "14px 20px", color: "#374151" }}>{app.institution}</td>
                <td style={{ padding: "14px 20px" }}>{fmt(app.annual_income)}</td>
                <td style={{ padding: "14px 20px" }}><Badge status={app.status} /></td>
                <td style={{ padding: "14px 20px" }}>
                  <Btn size="sm" onClick={() => onNav("app_detail", app.id)}>Review</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// ─── FINANCE DASHBOARD ────────────────────────────────────────────────────────
const FinanceDashboard = ({ apps, budget, onUpdateBudget }) => {
  const [showModal, setShowModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ academic_year: budget?.academic_year || "2024/2025", total_amount: budget?.total_amount || 0 });
  const awards = apps.filter(a => a.award).map(a => ({ ...a.award, applicant: a.full_name, institution: a.institution }));

  const saveBudget = () => {
    onUpdateBudget(budgetForm);
    setShowModal(false);
  };

  return (
    <div style={{ padding: "32px", maxWidth: 1000, margin: "0 auto" }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 30, margin: "0 0 6px", color: "#111827" }}>Finance & Disbursement</h1>
          <p style={{ color: "#6b7280", margin: 0 }}>Budget management and award tracking</p>
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
          <Card style={{ marginBottom: 24 }}>
            <p style={{ margin: "0 0 10px", fontWeight: 600, fontSize: 14, color: "#374151" }}>Budget Utilisation — {budget.academic_year}</p>
            <div style={{ height: 10, borderRadius: 6, background: "#f3f4f6", overflow: "hidden", marginBottom: 8 }}>
              <div style={{ height: "100%", width: `${Math.round((budget.allocated_amount / budget.total_amount) * 100)}%`, background: "linear-gradient(90deg, #1e40af, #3b82f6)", borderRadius: 6 }} />
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{Math.round((budget.allocated_amount / budget.total_amount) * 100)}% allocated · {Math.round((budget.disbursed_amount / budget.total_amount) * 100)}% disbursed</p>
          </Card>
        </>
      )}

      <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, margin: "0 0 16px", color: "#111827" }}>Awards Issued</h2>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
              {["Applicant", "Institution", "Tuition", "Upkeep", "Total", "Academic Year"].map(h => (
                <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {awards.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>No awards yet</td></tr>
            ) : (
              awards.map(aw => (
                <tr key={aw.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "14px 20px", fontWeight: 600, color: "#111827" }}>{aw.applicant}</td>
                  <td style={{ padding: "14px 20px", color: "#374151" }}>{aw.institution}</td>
                  <td style={{ padding: "14px 20px", color: "#1e40af", fontWeight: 600 }}>{fmt(aw.tuition_amount)}</td>
                  <td style={{ padding: "14px 20px" }}>{fmt(aw.upkeep_amount)}</td>
                  <td style={{ padding: "14px 20px", fontWeight: 700, color: "#059669" }}>{fmt(aw.total_amount)}</td>
                  <td style={{ padding: "14px 20px", color: "#6b7280" }}>{aw.academic_year || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {showModal && (
        <Modal title="Update Budget" onClose={() => setShowModal(false)}>
          <Input label="Academic Year" value={budgetForm.academic_year} onChange={v => setBudgetForm(f => ({ ...f, academic_year: v }))} placeholder="e.g. 2024/2025" />
          <Input label="Total Budget Amount (KES)" type="number" value={String(budgetForm.total_amount)} onChange={v => setBudgetForm(f => ({ ...f, total_amount: +v }))} />
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <Btn onClick={saveBudget}>Save Budget</Btn>
            <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── AUDITOR DASHBOARD ────────────────────────────────────────────────────────
const AuditorDashboard = ({ apps, budget }) => {
  const [tab, setTab] = useState("logs");
  const [filterEntity, setFilterEntity] = useState("");

  const filteredLogs = filterEntity ? AUDIT_LOGS.filter(l => l.entity_type === filterEntity) : AUDIT_LOGS;

  const actionColors = { STATUS_UPDATE: "#1e40af", DECISION_MADE: "#059669", DISBURSEMENT: "#7c3aed", BUDGET_UPDATE: "#d97706", APPLICATION_SUBMIT: "#0284c7" };

  const report = useMemo(() => ({
    total: apps.length,
    approved: apps.filter(a => ["approved", "funded"].includes(a.status)).length,
    rejected: apps.filter(a => a.status === "rejected").length,
    pending: apps.filter(a => ["submitted", "under_review"].includes(a.status)).length,
    totalAwarded: apps.reduce((s, a) => s + (a.award?.total_amount || 0), 0),
    byStatus: Object.entries(STATUS_META).map(([s, m]) => ({ status: s, label: m.label, count: apps.filter(a => a.status === s).length })).filter(x => x.count > 0),
  }), [apps]);

  return (
    <div style={{ padding: "32px", maxWidth: 1000, margin: "0 auto" }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 30, margin: "0 0 6px", color: "#111827" }}>Audit & Reports</h1>
      <p style={{ color: "#6b7280", marginBottom: 32 }}>System audit trail and analytics</p>

      <div style={{ display: "flex", gap: 6, marginBottom: 28, background: "#f9fafb", borderRadius: 12, padding: 6, width: "fit-content" }}>
        {["logs", "reports"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: tab === t ? "#1e40af" : "transparent", color: tab === t ? "#fff" : "#6b7280", fontWeight: 600, cursor: "pointer", fontSize: 14, fontFamily: "inherit", textTransform: "capitalize" }}>
            {t === "logs" ? "Audit Logs" : "Reports & Analytics"}
          </button>
        ))}
      </div>

      {tab === "logs" && (
        <>
          <Card style={{ marginBottom: 20, padding: "14px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>Filter by entity:</span>
              <select value={filterEntity} onChange={e => setFilterEntity(e.target.value)}
                style={{ padding: "7px 12px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 13, background: "#fff", fontFamily: "inherit" }}>
                <option value="">All</option>
                {["application", "decision", "disbursement", "budget", "user", "document"].map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
              </select>
            </div>
          </Card>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                  {["#", "User", "Action", "Entity", "Details", "Timestamp"].map(h => (
                    <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "12px 20px", color: "#9ca3af" }}>{log.id}</td>
                    <td style={{ padding: "12px 20px", fontWeight: 600 }}>{log.user?.username || "System"}</td>
                    <td style={{ padding: "12px 20px" }}>
                      <span style={{ background: (actionColors[log.action] || "#6b7280") + "18", color: actionColors[log.action] || "#6b7280", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{log.action}</span>
                    </td>
                    <td style={{ padding: "12px 20px", textTransform: "capitalize", color: "#374151" }}>{log.entity_type}</td>
                    <td style={{ padding: "12px 20px", color: "#6b7280", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.details}</td>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
            <StatCard label="Total Applications" value={report.total} accent="#1e40af" />
            <StatCard label="Approved / Funded" value={report.approved} accent="#059669" />
            <StatCard label="Rejected" value={report.rejected} accent="#dc2626" />
            <StatCard label="Total Awarded" value={fmt(report.totalAwarded)} accent="#7c3aed" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <Card>
              <h3 style={{ fontFamily: "'Instrument Serif', serif", margin: "0 0 16px", fontSize: 16, color: "#374151" }}>Applications by Status</h3>
              {report.byStatus.map(({ status, label, count }) => (
                <div key={status} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: "#374151" }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{count}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 4, background: "#f3f4f6", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.round((count / report.total) * 100)}%`, background: STATUS_META[status]?.color || "#6b7280", borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </Card>

            <Card>
              <h3 style={{ fontFamily: "'Instrument Serif', serif", margin: "0 0 16px", fontSize: 16, color: "#374151" }}>Budget Summary</h3>
              {budget && [
                ["Total Budget", fmt(budget.total_amount), "#1e40af"],
                ["Allocated", fmt(budget.allocated_amount), "#7c3aed"],
                ["Disbursed", fmt(budget.disbursed_amount), "#059669"],
                ["Remaining", fmt(budget.total_amount - budget.allocated_amount), "#d97706"],
              ].map(([label, value, color]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color }}>{value}</span>
                </div>
              ))}
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Budget Utilisation</p>
                <div style={{ height: 8, borderRadius: 4, background: "#f3f4f6" }}>
                  <div style={{ height: "100%", width: `${budget ? Math.round((budget.allocated_amount / budget.total_amount) * 100) : 0}%`, background: "#1e40af", borderRadius: 4 }} />
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("login");
  const [apps, setApps] = useState(INITIAL_APPS);
  const [budget, setBudget] = useState(INITIAL_BUDGET);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = (u) => {
    setUser(u);
    const defaultViews = { admin: "admin_dash", committee: "committee_dash", finance: "finance_dash", auditor: "audit_dash", student: "student_dash" };
    setView(defaultViews[u.role] || "student_dash");
  };

  const handleLogout = () => { setUser(null); setView("login"); };

  const handleNav = (v, id) => {
    if (id) setSelectedAppId(id);
    setView(v);
  };

  const handleNewApp = (app) => {
    setApps(prev => [app, ...prev]);
    showToast("Application submitted successfully!");
    setView("student_dash");
  };

  const handleUpdateApp = (id, updates) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    showToast("Application updated.");
  };

  const handleUpdateBudget = (data) => {
    setBudget(prev => ({ ...prev, ...data }));
    showToast("Budget updated successfully!");
  };

  const selectedApp = apps.find(a => a.id === selectedAppId);

  if (!user || view === "login") return <Login onLogin={handleLogin} />;

  const renderView = () => {
    if (view === "app_detail" && selectedApp) {
      return <AppDetail app={selectedApp} user={user} onBack={() => setView(user.role === "admin" ? "admin_dash" : "student_dash")} onUpdate={handleUpdateApp} />;
    }
    if (view === "apply") return <ApplicationForm user={user} onSubmit={handleNewApp} onCancel={() => setView("student_dash")} />;
    if (view === "student_dash") return <StudentDashboard user={user} apps={apps} onNav={handleNav} />;
    if (view === "admin_dash" || view === "admin_apps") return <AdminDashboard apps={apps} budget={budget} onNav={handleNav} onUpdateApp={handleUpdateApp} />;
    if (view === "committee_dash") return <CommitteeDashboard apps={apps} onNav={handleNav} />;
    if (view === "finance_dash" || view === "budget") return <FinanceDashboard apps={apps} budget={budget} onUpdateBudget={handleUpdateBudget} />;
    if (view === "audit_dash" || view === "reports") return <AuditorDashboard apps={apps} budget={budget} />;
    return <StudentDashboard user={user} apps={apps} onNav={handleNav} />;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <Navbar user={user} onLogout={handleLogout} onNav={handleNav} />
      <main>{renderView()}</main>

      {toast && (
        <div style={{ position: "fixed", bottom: 32, right: 32, background: toast.type === "success" ? "#059669" : "#dc2626", color: "#fff", padding: "14px 22px", borderRadius: 12, fontSize: 14, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", zIndex: 1000, animation: "slideIn 0.3s ease" }}>
          ✓ {toast.msg}
        </div>
      )}
    </div>
  );
}

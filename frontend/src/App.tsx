import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import ApplicationForm from "./pages/ApplicationForm";
import ApplicationStatus from "./pages/ApplicationStatus";
import AdminDashboard from "./pages/AdminDashboard";
import AdminReview from "./pages/AdminReview";
import CommitteeDashboard from "./pages/CommitteeDashboard";
import FinanceDashboard from "./pages/FinanceDashboard";
import AuditorDashboard from "./pages/AuditorDashboard";

function Guard({ children, roles }: { children: React.ReactElement; roles?: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={getDefaultRoute(user.role)} replace />;
  }
  return children;
}

function getDefaultRoute(role: string) {
  switch (role) {
    case "admin": return "/admin";
    case "committee": return "/committee";
    case "finance": return "/finance";
    case "auditor": return "/auditor";
    default: return "/dashboard";
  }
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Guard roles={["student"]}><StudentDashboard /></Guard>} />
          <Route path="/apply" element={<Guard roles={["student"]}><ApplicationForm /></Guard>} />
          <Route path="/applications/:id" element={<Guard><ApplicationStatus /></Guard>} />
          <Route path="/admin" element={<Guard roles={["admin"]}><AdminDashboard /></Guard>} />
          <Route path="/admin/applications/:id" element={<Guard roles={["admin"]}><AdminReview /></Guard>} />
          <Route path="/committee" element={<Guard roles={["admin", "committee"]}><CommitteeDashboard /></Guard>} />
          <Route path="/finance" element={<Guard roles={["admin", "finance"]}><FinanceDashboard /></Guard>} />
          <Route path="/auditor" element={<Guard roles={["admin", "auditor"]}><AuditorDashboard /></Guard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { getApplications, getStats, Application, ApplicationStatus } from "../api";
import StatusBadge from "../components/StatusBadge";
import Navbar from "../components/Navbar";

export default function CommitteeDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("");

  useEffect(() => {
    loadApplications();
  }, [filterStatus]);

  const loadApplications = async () => {
    try {
      const params: any = { page: 1, page_size: 50 };
      if (filterStatus) params.status = filterStatus;
      const res = await getApplications(params);
      setApplications(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pendingApps = applications.filter(a => 
    a.status === "pending_decision" || a.status === "documents_verified" || a.status === "under_review"
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar title="Committee Dashboard" user={user} onLogout={logout} />
      <div className="container mx-auto p-6">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">Bursary Applications - Committee Review</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4 items-center">
            <label className="font-medium">Filter by Status:</label>
            <select 
              className="input w-auto" 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All</option>
              <option value="pending_decision">Pending Decision</option>
              <option value="documents_verified">Documents Verified</option>
              <option value="under_review">Under Review</option>
              <option value="submitted">Submitted</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="text-center py-8">Loading...</p>
        ) : (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="font-semibold text-blue-800">
                Applications Pending Decision: {pendingApps.length}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-4 text-left">ID</th>
                    <th className="p-4 text-left">Name</th>
                    <th className="p-4 text-left">Institution</th>
                    <th className="p-4 text-left">Course</th>
                    <th className="p-4 text-left">Year</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.length === 0 ? (
                    <tr><td colSpan={7} className="p-4 text-center text-gray-500">No applications found</td></tr>
                  ) : (
                    applications.map(app => (
                      <tr key={app.id} className="border-t hover:bg-slate-50">
                        <td className="p-4">#{app.id}</td>
                        <td className="p-4">{app.full_name}</td>
                        <td className="p-4">{app.institution}</td>
                        <td className="p-4">{app.course}</td>
                        <td className="p-4">{app.year_of_study}</td>
                        <td className="p-4"><StatusBadge status={app.status} /></td>
                        <td className="p-4">
                          <Link to={`/admin/applications/${app.id}`} className="text-blue-600 hover:underline">
                            Review
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
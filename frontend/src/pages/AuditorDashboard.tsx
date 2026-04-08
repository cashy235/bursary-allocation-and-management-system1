import { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { getAuditLogs, getReport, exportCSV } from "../api";
import type { AuditLog } from "../api";
import Navbar from "../components/Navbar";
import PlatformBanner from "../components/PlatformBanner";

export default function AuditorDashboard() {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterEntity, setFilterEntity] = useState("");
  const [activeTab, setActiveTab] = useState<"logs" | "reports">("logs");

  useEffect(() => {
    loadData();
  }, [filterEntity]);

  const loadData = async () => {
    try {
      const params: any = { page: 1, page_size: 100 };
      if (filterEntity) params.entity_type = filterEntity;
      const res = await getAuditLogs(params);
      setAuditLogs(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadReport = async () => {
    try {
      const res = await getReport();
      setReport(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportCSV({});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "applications_export.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <PlatformBanner />
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">Audit & Reports</h1>
          <div className="flex gap-2">
            <button 
              onClick={() => { setActiveTab("logs"); loadData(); }}
              className={`px-4 py-2 rounded ${activeTab === "logs" ? "bg-blue-600 text-white" : "bg-white text-gray-700 border"}`}
            >
              Audit Logs
            </button>
            <button 
              onClick={() => { setActiveTab("reports"); loadReport(); }}
              className={`px-4 py-2 rounded ${activeTab === "reports" ? "bg-blue-600 text-white" : "bg-white text-gray-700 border"}`}
            >
              Reports
            </button>
          </div>
        </div>

        {activeTab === "logs" && (
          <>
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex gap-4 items-center">
                <label className="font-medium">Filter by Entity:</label>
                <select 
                  className="input w-auto" 
                  value={filterEntity} 
                  onChange={(e) => setFilterEntity(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="application">Application</option>
                  <option value="document">Document</option>
                  <option value="decision">Decision</option>
                  <option value="disbursement">Disbursement</option>
                  <option value="user">User</option>
                </select>
                <button onClick={loadData} className="btn-secondary">Refresh</button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-4 text-left">ID</th>
                    <th className="p-4 text-left">User</th>
                    <th className="p-4 text-left">Action</th>
                    <th className="p-4 text-left">Entity</th>
                    <th className="p-4 text-left">Details</th>
                    <th className="p-4 text-left">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr>
                  ) : auditLogs.length === 0 ? (
                    <tr><td colSpan={6} className="p-4 text-center text-gray-500">No audit logs found</td></tr>
                  ) : (
                    auditLogs.map(log => (
                      <tr key={log.id} className="border-t hover:bg-slate-50">
                        <td className="p-4">#{log.id}</td>
                        <td className="p-4">{log.user?.username || "System"}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">{log.action}</span>
                        </td>
                        <td className="p-4">{log.entity_type}</td>
                        <td className="p-4 text-sm text-gray-600 max-w-xs truncate">{log.details || "-"}</td>
                        <td className="p-4 text-sm">{new Date(log.created_at).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === "reports" && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button onClick={handleExport} className="btn-primary">
                Export CSV
              </button>
            </div>

            {report && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-sm text-gray-500">Total Applications</p>
                  <p className="text-3xl font-bold text-slate-800">{report.total}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-sm text-gray-500">Approved</p>
                  <p className="text-3xl font-bold text-green-600">{report.approved}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-sm text-gray-500">Rejected</p>
                  <p className="text-3xl font-bold text-red-600">{report.rejected}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">{report.pending}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-sm text-gray-500">Total Requested</p>
                  <p className="text-3xl font-bold text-blue-600">KES {report.total_requested?.toLocaleString()}</p>
                </div>
              </div>
            )}

            {report && report.by_status && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">By Status</h3>
                <div className="space-y-2">
                  {Object.entries(report.by_status).map(([status, count]: [string, any]) => (
                    <div key={status} className="flex justify-between items-center border-b pb-2">
                      <span className="capitalize">{status.replace("_", " ")}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
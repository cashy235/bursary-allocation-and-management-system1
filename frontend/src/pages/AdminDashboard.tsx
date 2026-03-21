import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getApplications, getStats, getBudget, setBudget } from "../api";
import type { Application, Budget } from "../api";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";

export default function AdminDashboard() {
  const [apps, setApps] = useState<Application[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [, setBudgetState] = useState<Budget | null>(null);
  const [budgetInput, setBudgetInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = () => {
    getApplications(statusFilter ? { status: statusFilter } : {}).then(setApps);
    getStats().then(setStats);
    getBudget().then(b => { setBudgetState(b); setBudgetInput(String(b.total_amount)); });
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleBudget = async () => {
    await setBudget(+budgetInput);
    load();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto p-6 space-y-6">

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Applications" value={stats.total_applications} color="blue" />
            <StatCard label="Budget (KES)" value={stats.budget.total.toLocaleString()} color="gray" />
            <StatCard label="Allocated (KES)" value={stats.budget.allocated.toLocaleString()} color="green" />
            <StatCard label="Remaining (KES)" value={stats.budget.remaining.toLocaleString()} color="yellow" />
          </div>
        )}

        {/* Status breakdown */}
        {stats?.by_status && (
          <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3">
            {Object.entries(stats.by_status).map(([s, c]) => (
              <span key={s} className="text-sm bg-gray-100 px-3 py-1 rounded-full">
                <span className="capitalize">{s.replace("_", " ")}</span>: <strong>{c as number}</strong>
              </span>
            ))}
          </div>
        )}

        {/* Budget control */}
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Set Total Budget (KES):</label>
          <input className="input w-48" type="number" value={budgetInput}
            onChange={e => setBudgetInput(e.target.value)} />
          <button className="btn-primary" onClick={handleBudget}>Update</button>
        </div>

        {/* Applications table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b flex items-center gap-3">
            <h3 className="font-semibold text-gray-800 flex-1">Applications</h3>
            <select className="input w-44" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              {["submitted","under_review","approved","rejected","funded"].map(s => (
                <option key={s} value={s}>{s.replace("_"," ")}</option>
              ))}
            </select>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                {["#","Name","Institution","Income","Status","Date","Action"].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {apps.map(app => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{app.id}</td>
                  <td className="px-4 py-3 font-medium">{app.full_name}</td>
                  <td className="px-4 py-3 text-gray-500">{app.institution}</td>
                  <td className="px-4 py-3">KES {app.annual_income.toLocaleString()}</td>
                  <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                  <td className="px-4 py-3 text-gray-400">{new Date(app.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/applications/${app.id}`} className="text-blue-500 hover:underline">Review</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {apps.length === 0 && <p className="text-center text-gray-400 py-8">No applications found.</p>}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700", gray: "bg-gray-100 text-gray-700",
    green: "bg-green-50 text-green-700", yellow: "bg-yellow-50 text-yellow-700"
  };
  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

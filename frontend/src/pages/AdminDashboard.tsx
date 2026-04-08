import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getApplications, getStats, getBudget, setBudget, updateApplication } from "../api";
import type { Application, Budget, ApplicationStatus, PaginatedResponse } from "../api";
import Navbar from "../components/Navbar";
import PlatformBanner from "../components/PlatformBanner";
import StatusBadge from "../components/StatusBadge";

const STATUSES: ApplicationStatus[] = ["draft", "submitted", "under_review", "documents_verified", "pending_decision", "approved", "rejected", "awarded", "disbursed", "closed"];
type SortBy = "newest" | "oldest" | "income_high" | "income_low" | "name_az";

export default function AdminDashboard() {
  const [apps, setApps] = useState<Application[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [, setBudgetState] = useState<Budget | null>(null);
  const [budgetInput, setBudgetInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "">("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [rowStatus, setRowStatus] = useState<Record<number, ApplicationStatus>>({});
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const load = () => {
    const params = statusFilter ? { status: statusFilter, page_size: 100 } : { page_size: 100 };
    getApplications(params).then((data: PaginatedResponse<Application>) => {
      setApps(data.items);
      const next: Record<number, ApplicationStatus> = {};
      data.items.forEach((app) => { next[app.id] = app.status; });
      setRowStatus(next);
    });
    getStats().then(setStats);
    getBudget().then(b => { setBudgetState(b); setBudgetInput(String(b.total_amount)); });
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleBudget = async () => {
    const budget = await getBudget();
    await setBudget(budget.academic_year || "2024-2025", +budgetInput);
    load();
  };

  const visibleApps = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = apps;
    if (term) {
      list = list.filter((app) =>
        app.full_name.toLowerCase().includes(term) ||
        app.institution.toLowerCase().includes(term) ||
        app.course.toLowerCase().includes(term)
      );
    }
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === "income_high") return b.annual_income - a.annual_income;
      if (sortBy === "income_low") return a.annual_income - b.annual_income;
      return a.full_name.localeCompare(b.full_name);
    });
    return sorted;
  }, [apps, search, sortBy]);

  const quickSetStatus = async (appId: number) => {
    const nextStatus = rowStatus[appId];
    if (!nextStatus) return;
    setUpdatingId(appId);
    try {
      await updateApplication(appId, { status: nextStatus });
      load();
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <PlatformBanner />
      <div className="max-w-6xl mx-auto p-6 space-y-6">

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Applications" value={stats.total_applications} color="blue" />
            <StatCard label="Budget (KES)" value={Number(stats.budget.total).toLocaleString()} color="gray" />
            <StatCard label="Allocated (KES)" value={Number(stats.budget.allocated).toLocaleString()} color="green" />
            <StatCard label="Remaining (KES)" value={Number(stats.budget.remaining).toLocaleString()} color="yellow" />
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
            <input
              className="input w-64"
              placeholder="Search name, institution, course"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="input w-44" value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="income_high">Income: High to Low</option>
              <option value="income_low">Income: Low to High</option>
              <option value="name_az">Name: A to Z</option>
            </select>
            <select className="input w-44" value={statusFilter} onChange={e => setStatusFilter(e.target.value as ApplicationStatus | "")}>
              <option value="">All Statuses</option>
              {STATUSES.map(s => (
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
              {visibleApps.map(app => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{app.id}</td>
                  <td className="px-4 py-3 font-medium">{app.full_name}</td>
                  <td className="px-4 py-3 text-gray-500">{app.institution}</td>
                  <td className="px-4 py-3">KES {app.annual_income.toLocaleString()}</td>
                  <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                  <td className="px-4 py-3 text-gray-400">{new Date(app.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        className="input w-36 !py-1"
                        value={rowStatus[app.id] ?? app.status}
                        onChange={e => setRowStatus(prev => ({ ...prev, [app.id]: e.target.value as ApplicationStatus }))}
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{s.replace("_", " ")}</option>
                        ))}
                      </select>
                      <button
                        className="btn-primary !py-1 !px-2 text-xs"
                        onClick={() => quickSetStatus(app.id)}
                        disabled={updatingId === app.id}
                      >
                        {updatingId === app.id ? "Saving..." : "Save"}
                      </button>
                      <Link to={`/admin/applications/${app.id}`} className="text-blue-500 hover:underline">Review</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleApps.length === 0 && <p className="text-center text-gray-400 py-8">No applications found.</p>}
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

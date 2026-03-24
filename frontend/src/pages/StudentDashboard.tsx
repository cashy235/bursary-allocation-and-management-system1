import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getApplications } from "../api";
import type { Application } from "../api";
import { useAuth } from "../AuthContext";
import Navbar from "../components/Navbar";
import PlatformBanner from "../components/PlatformBanner";
import StatusBadge from "../components/StatusBadge";

const STATUSES = ["submitted", "under_review", "approved", "funded", "rejected"] as const;
type StatusFilter = "all" | (typeof STATUSES)[number];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    if (user) getApplications({ user_id: user.id }).then(setApps);
  }, [user]);

  const summary = useMemo(() => {
    const by = (status: string) => apps.filter(a => a.status === status).length;
    return {
      total: apps.length,
      submitted: by("submitted"),
      underReview: by("under_review"),
      approved: by("approved"),
      funded: by("funded"),
      rejected: by("rejected"),
    };
  }, [apps]);

  const visibleApps = useMemo(() => {
    const term = search.trim().toLowerCase();
    return apps.filter((app) => {
      const statusMatch = statusFilter === "all" ? true : app.status === statusFilter;
      const termMatch = !term ||
        app.full_name.toLowerCase().includes(term) ||
        app.institution.toLowerCase().includes(term) ||
        app.course.toLowerCase().includes(term);
      return statusMatch && termMatch;
    });
  }, [apps, search, statusFilter]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <PlatformBanner />
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">My Applications</h2>
          <Link to="/apply" className="btn-primary">+ New Application</Link>
        </div>

        {apps.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
              <SummaryCard label="Total" value={summary.total} tone="slate" />
              <SummaryCard label="Submitted" value={summary.submitted} tone="blue" />
              <SummaryCard label="Under Review" value={summary.underReview} tone="yellow" />
              <SummaryCard label="Approved" value={summary.approved} tone="emerald" />
              <SummaryCard label="Funded" value={summary.funded} tone="green" />
              <SummaryCard label="Rejected" value={summary.rejected} tone="rose" />
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap gap-3">
              <input
                className="input md:w-80"
                placeholder="Search by name, institution, or course"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select
                className="input w-48"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as StatusFilter)}
              >
                <option value="all">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace("_", " ")}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {apps.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center text-gray-400 shadow-sm">
            No applications yet. <Link to="/apply" className="text-blue-500 underline">Apply now</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleApps.map(app => (
              <Link to={`/applications/${app.id}`} key={app.id}
                className="block bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">{app.full_name}</p>
                    <p className="text-sm text-gray-500">{app.institution} · {app.course}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(app.created_at).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
                {app.allocation && (
                  <p className="mt-2 text-sm text-green-600 font-medium">
                    Allocated: KES {app.allocation.amount.toLocaleString()}
                  </p>
                )}
                <div className="mt-3">
                  <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Progress</p>
                  <ProgressBar status={app.status} />
                </div>
              </Link>
            ))}
            {visibleApps.length === 0 && (
              <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm">
                No applications match your filters.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    blue: "bg-blue-50 text-blue-700",
    yellow: "bg-yellow-50 text-yellow-700",
    emerald: "bg-emerald-50 text-emerald-700",
    green: "bg-green-50 text-green-700",
    rose: "bg-rose-50 text-rose-700",
  };
  return (
    <div className={`rounded-xl p-3 ${tones[tone] ?? tones.slate}`}>
      <p className="text-xs opacity-80">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function ProgressBar({ status }: { status: Application["status"] }) {
  const progressByStatus: Record<Application["status"], number> = {
    submitted: 20,
    under_review: 50,
    approved: 80,
    funded: 100,
    rejected: 100,
  };
  const progress = progressByStatus[status];
  const color = status === "rejected" ? "bg-red-500" : "bg-blue-600";
  return (
    <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
      <div className={`h-2 ${color}`} style={{ width: `${progress}%` }} />
    </div>
  );
}

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getApplication, updateApplication, createAward } from "../api";
import type { Application, ApplicationStatus } from "../api";
import Navbar from "../components/Navbar";
import PlatformBanner from "../components/PlatformBanner";
import StatusBadge from "../components/StatusBadge";

const STATUSES: ApplicationStatus[] = ["draft", "submitted", "under_review", "documents_verified", "pending_decision", "approved", "rejected", "awarded", "disbursed", "closed"];

export default function AdminReview() {
  const { id } = useParams();
  const nav = useNavigate();
  const [app, setApp] = useState<Application | null>(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>("submitted");
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => getApplication(+id!).then(a => {
    setApp(a); setNotes(a.notes || ""); setStatus(a.status);
  });

  useEffect(() => { if (id) load(); }, [id]);

  const handleUpdate = async () => {
    await updateApplication(+id!, { status, notes });
    setMsg("Updated successfully.");
    load();
  };

  const handleAllocate = async () => {
    try {
      await createAward(+id!, {
        total_amount: +amount,
        tuition_amount: Math.round(+amount * 0.75),
        upkeep_amount: Math.round(+amount * 0.25),
      });
      setMsg("Funds allocated!");
      load();
    } catch (e: any) {
      setMsg(e.response?.data?.detail || "Allocation failed.");
    }
  };

  if (!app) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <PlatformBanner />
      <p className="p-6 text-gray-400">Loading...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <PlatformBanner />
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <button onClick={() => nav("/admin")} className="text-sm text-blue-500 hover:underline">← Back</button>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-gray-800">Application #{app.id}</h2>
            <StatusBadge status={app.status} />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            {[
              ["Name", app.full_name], ["Institution", app.institution],
              ["Course", app.course], ["Year", app.year_of_study],
              ["Income", `KES ${app.annual_income.toLocaleString()}`],
              ["Submitted", new Date(app.created_at).toLocaleDateString()],
            ].map(([k, v]) => (
              <div key={k as string}>
                <p className="text-gray-400 text-xs">{k}</p>
                <p className="font-medium text-gray-700">{v}</p>
              </div>
            ))}
          </div>
          <div className="mb-4">
            <p className="text-gray-400 text-xs">Reason</p>
            <p className="text-sm text-gray-700 mt-1">{app.reason}</p>
          </div>

          {/* Documents */}
          {app.documents.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-1">Documents</p>
              {app.documents.map(d => (
                <span key={d.id} className="text-sm text-blue-500 mr-3">📄 {d.filename}</span>
              ))}
            </div>
          )}

          {/* Status & Notes */}
          <div className="space-y-3 border-t pt-4">
            <div>
              <label className="label">Update Status</label>
              <select className="input" value={status} onChange={e => setStatus(e.target.value as ApplicationStatus)}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Notes / Comments</label>
              <textarea className="input h-20 resize-none" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={handleUpdate}>Save Changes</button>
          </div>

          {/* Allocation */}
          {(app.status === "approved" || app.status === "awarded") && (
            <div className="border-t pt-4 mt-4 space-y-3">
              <h3 className="font-semibold text-gray-700">Allocate Funds</h3>
              {app.award && (
                <p className="text-sm text-green-600">Currently awarded: KES {app.award.total_amount.toLocaleString()}</p>
              )}
              <div className="flex gap-3">
                <input className="input flex-1" type="number" placeholder="Amount (KES)"
                  value={amount} onChange={e => setAmount(e.target.value)} />
                <button className="btn-success" onClick={handleAllocate}>Award</button>
              </div>
            </div>
          )}

          {msg && <p className="mt-3 text-sm text-blue-600 font-medium">{msg}</p>}
        </div>
      </div>
    </div>
  );
}

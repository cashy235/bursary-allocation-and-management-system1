import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getApplication } from "../api";
import type { Application } from "../api";
import Navbar from "../components/Navbar";
import PlatformBanner from "../components/PlatformBanner";
import StatusBadge from "../components/StatusBadge";

export default function ApplicationStatus() {
  const { id } = useParams();
  const [app, setApp] = useState<Application | null>(null);

  useEffect(() => {
    if (id) getApplication(+id).then(setApp);
  }, [id]);

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
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-gray-800">Application #{app.id}</h2>
            <StatusBadge status={app.status} />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Full Name", app.full_name],
              ["Institution", app.institution],
              ["Course", app.course],
              ["Year of Study", app.year_of_study],
              ["Annual Income", `KES ${app.annual_income.toLocaleString()}`],
              ["Submitted", new Date(app.created_at).toLocaleDateString()],
            ].map(([k, v]) => (
              <div key={k as string}>
                <p className="text-gray-400 text-xs">{k}</p>
                <p className="font-medium text-gray-700">{v}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <p className="text-gray-400 text-xs">Reason</p>
            <p className="text-gray-700 text-sm mt-1">{app.reason}</p>
          </div>
          {app.notes && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-700 font-medium">Reviewer Notes</p>
              <p className="text-sm text-yellow-800 mt-1">{app.notes}</p>
            </div>
          )}
          {app.allocation && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-700 font-medium">Bursary Allocated</p>
              <p className="text-2xl font-bold text-green-700 mt-1">KES {app.allocation.amount.toLocaleString()}</p>
            </div>
          )}
        </div>

        {app.documents.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-700 mb-3">Documents</h3>
            <ul className="space-y-2">
              {app.documents.map(doc => (
                <li key={doc.id} className="text-sm text-blue-600 flex items-center gap-2">
                  <span>📄</span> {doc.filename}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getApplications } from "../api";
import type { Application } from "../api";
import { useAuth } from "../AuthContext";
import Navbar from "../components/Navbar";
import PlatformBanner from "../components/PlatformBanner";
import StatusBadge from "../components/StatusBadge";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);

  useEffect(() => {
    if (user) getApplications({ user_id: user.id }).then(setApps);
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <PlatformBanner />
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">My Applications</h2>
          <Link to="/apply" className="btn-primary">+ New Application</Link>
        </div>

        {apps.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center text-gray-400 shadow-sm">
            No applications yet. <Link to="/apply" className="text-blue-500 underline">Apply now</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {apps.map(app => (
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
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

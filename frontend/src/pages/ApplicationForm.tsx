import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createApplication, uploadDocument } from "../api";
import { useAuth } from "../AuthContext";
import Navbar from "../components/Navbar";
import PlatformBanner from "../components/PlatformBanner";

export default function ApplicationForm() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "", institution: "", course: "",
    year_of_study: 1, annual_income: 0, reason: ""
  });

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const app = await createApplication(user.id, form);
      if (files) {
        for (const file of Array.from(files)) {
          await uploadDocument(app.id, file);
        }
      }
      nav(`/applications/${app.id}`);
    } catch {
      alert("Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <PlatformBanner />
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Bursary Application</h2>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={form.full_name} onChange={e => set("full_name", e.target.value)} required />
            </div>
            <div>
              <label className="label">Institution</label>
              <input className="input" value={form.institution} onChange={e => set("institution", e.target.value)} required />
            </div>
            <div>
              <label className="label">Course</label>
              <input className="input" value={form.course} onChange={e => set("course", e.target.value)} required />
            </div>
            <div>
              <label className="label">Year of Study</label>
              <input className="input" type="number" min={1} max={6} value={form.year_of_study}
                onChange={e => set("year_of_study", +e.target.value)} required />
            </div>
            <div className="col-span-2">
              <label className="label">Annual Household Income (KES)</label>
              <input className="input" type="number" min={0} value={form.annual_income}
                onChange={e => set("annual_income", +e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="label">Reason for Application</label>
            <textarea className="input h-28 resize-none" value={form.reason}
              onChange={e => set("reason", e.target.value)} required />
          </div>
          <div>
            <label className="label">Supporting Documents (optional)</label>
            <input type="file" multiple className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
              file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
              onChange={e => setFiles(e.target.files)} />
          </div>
          <button className="btn-primary w-full" type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}

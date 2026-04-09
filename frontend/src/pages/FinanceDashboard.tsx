import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { getAwards, getDisbursements, getBudget, setBudget, Award, Disbursement, Budget, ApplicationStatus } from "../api";
import Navbar from "../components/Navbar";

export default function FinanceDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [awards, setAwards] = useState<Award[]>([]);
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [budget, setBudgetData] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ academic_year: "", total_amount: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [awardsRes, disbRes, budgetRes] = await Promise.all([
        getAwards({ page: 1, page_size: 50 }),
        getDisbursements({ page: 1, page_size: 50 }),
        getBudget()
      ]);
      setAwards(awardsRes.items);
      setDisbursements(disbRes.items);
      setBudgetData(budgetRes);
      setBudgetForm({ academic_year: budgetRes.academic_year || "", total_amount: budgetRes.total_amount });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBudget = async () => {
    try {
      await setBudget(budgetForm.academic_year, budgetForm.total_amount);
      setShowBudgetModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const pendingDisbursements = disbursements.filter(d => d.status === "pending");
  const totalPaid = disbursements.filter(d => d.status === "paid").reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar title="Finance Dashboard" user={user} onLogout={logout} />
      <div className="container mx-auto p-6">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">Finance & Disbursement Management</h1>
        </div>

        {budget && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Total Budget</p>
              <p className="text-2xl font-bold text-slate-800">KES {budget.total_amount.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Allocated</p>
              <p className="text-2xl font-bold text-blue-600">KES {budget.allocated_amount.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Disbursed</p>
              <p className="text-2xl font-bold text-green-600">KES {budget.disbursed_amount.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Remaining</p>
              <p className="text-2xl font-bold text-purple-600">KES {(budget.total_amount - budget.allocated_amount).toLocaleString()}</p>
            </div>
          </div>
        )}

        <div className="flex gap-4 mb-6">
          <button onClick={() => setShowBudgetModal(true)} className="btn-primary">
            Set Budget
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Recent Awards</h2>
            </div>
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">Tuition</th>
                  <th className="p-3 text-left">Upkeep</th>
                  <th className="p-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {awards.length === 0 ? (
                  <tr><td colSpan={5} className="p-4 text-center text-gray-500">No awards yet</td></tr>
                ) : (
                  awards.slice(0, 10).map(award => (
                    <tr key={award.id} className="border-t">
                      <td className="p-3">#{award.id}</td>
                      <td className="p-3">KES {award.total_amount.toLocaleString()}</td>
                      <td className="p-3">KES {award.tuition_amount.toLocaleString()}</td>
                      <td className="p-3">KES {award.upkeep_amount.toLocaleString()}</td>
                      <td className="p-3">{new Date(award.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Disbursements</h2>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                Pending: {pendingDisbursements.length}
              </span>
            </div>
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {disbursements.length === 0 ? (
                  <tr><td colSpan={4} className="p-4 text-center text-gray-500">No disbursements yet</td></tr>
                ) : (
                  disbursements.slice(0, 10).map(disb => (
                    <tr key={disb.id} className="border-t">
                      <td className="p-3">#{disb.id}</td>
                      <td className="p-3 capitalize">{disb.disbursement_type}</td>
                      <td className="p-3">KES {disb.amount.toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-sm ${disb.status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                          {disb.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showBudgetModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Set Budget</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Academic Year</label>
                  <input 
                    className="input" 
                    value={budgetForm.academic_year}
                    onChange={(e) => setBudgetForm({...budgetForm, academic_year: e.target.value})}
                    placeholder="e.g., 2024-2025"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total Amount (KES)</label>
                  <input 
                    className="input" 
                    type="number"
                    value={budgetForm.total_amount}
                    onChange={(e) => setBudgetForm({...budgetForm, total_amount: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button onClick={handleSaveBudget} className="btn-primary flex-1">Save</button>
                <button onClick={() => setShowBudgetModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, seed } from "../api";
import { useAuth } from "../AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const { setUser } = useAuth();
  const nav = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanUsername = username.trim();
      const user = await login(cleanUsername);
      setUser(user);
      nav(user.role === "admin" ? "/admin" : "/dashboard");
    } catch {
      setError("Login failed. Try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-lg border border-slate-100 w-full max-w-md">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-2">
          Cloud bursary platform
        </p>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2 leading-tight">
          Secure bursary allocation &amp; management
        </h1>
        <p className="text-slate-600 text-sm mb-1">
          React frontend · FastAPI backend · PostgreSQL
        </p>
        <p className="text-gray-500 text-sm mb-6">Sign in to continue</p>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            className="input"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
          />
          <button className="btn-primary w-full" type="submit">Login</button>
        </form>
        <p className="text-xs text-gray-400 mt-4 text-center">
          Demo mode: enter any username. Use <strong>admin</strong> for admin; any other username is a student.
        </p>
        <button onClick={() => seed().then(() => alert("Seeded!"))}
          className="mt-3 text-xs text-blue-400 underline w-full text-center">
          Seed sample data
        </button>
      </div>
    </div>
  );
}

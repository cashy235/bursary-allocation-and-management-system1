import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, seed } from "../api";
import { useAuth } from "../AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { setUser } = useAuth();
  const nav = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await login(username, password);
      setUser(user);
      nav(user.role === "admin" ? "/admin" : "/dashboard");
    } catch {
      setError("Login failed. Try again.");
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold text-blue-700 mb-1">Bursary System</h1>
        <p className="text-gray-500 text-sm mb-6">Sign in to continue</p>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <input className="input" placeholder="Username" value={username}
            onChange={e => setUsername(e.target.value)} required />
          <input className="input" type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} required />
          <button className="btn-primary w-full" type="submit">Login</button>
        </form>
        <p className="text-xs text-gray-400 mt-4 text-center">
          Use <strong>admin</strong> for admin access, any other name for student.
        </p>
        <button onClick={() => seed().then(() => alert("Seeded!"))}
          className="mt-3 text-xs text-blue-400 underline w-full text-center">
          Seed sample data
        </button>
      </div>
    </div>
  );
}

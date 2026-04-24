import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { login, register, getCurrentUser } from "../api";
import { useAuth } from "../AuthContext";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const { setUser } = useAuth();
  const nav = useNavigate();

  const getDashboardPathByRole = (role: string) => {
    if (role === "admin") return "/admin";
    if (role === "committee") return "/committee";
    if (role === "finance") return "/finance";
    if (role === "auditor") return "/auditor";
    return "/dashboard";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegister) {
        const data = await register(username, email, password, fullName || undefined);
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        const user = await getCurrentUser();
        setUser(user);
        nav(getDashboardPathByRole(user.role));
      } else {
        const data = await login(username, password);
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        const user = await getCurrentUser();
        setUser(user);
        nav(getDashboardPathByRole(user.role));
      }
    } catch (err: unknown) {
      let msg = "Failed. Try again.";
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        if (Array.isArray(detail)) {
          msg = detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join(", ") || msg;
        } else if (typeof detail === "string") {
          msg = detail;
        } else {
          msg = err.message || msg;
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-lg border border-slate-100 w-full max-w-md">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-2">
          Bursary Management System
        </p>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2 leading-tight">
          Secure Login
        </h1>
        <p className="text-slate-600 text-sm mb-6">
          {isRegister ? "Create your account" : "Sign in to continue"}
        </p>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="input"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
            minLength={3}
            required
          />
          {isRegister && (
            <>
              <input
                className="input"
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <input
                className="input"
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                autoComplete="name"
              />
            </>
          )}
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete={isRegister ? "new-password" : "current-password"}
            minLength={6}
            required
          />
          <button className="btn-primary w-full" type="submit">
            {isRegister ? "Register" : "Login"}
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-4 text-center">
          {isRegister ? (
            <>
              Already have an account?{" "}
              <button onClick={() => { setIsRegister(false); setError(""); }} className="text-blue-500 underline">
                Sign in
              </button>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <button onClick={() => { setIsRegister(true); setError(""); }} className="text-blue-500 underline">
                Register
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}


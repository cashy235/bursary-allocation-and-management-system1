import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Navbar() {
  const { user, setUser } = useAuth();
  const nav = useNavigate();
  const logout = () => { setUser(null); nav("/"); };

  return (
    <nav className="bg-white border-b shadow-sm px-6 py-3 flex items-center justify-between">
      <Link to={user?.role === "admin" ? "/admin" : "/dashboard"}
        className="text-blue-700 font-bold text-lg">🎓 Bursary Cloud</Link>
      <div className="flex items-center gap-4">
        {user?.role === "student" && (
          <Link to="/apply" className="text-sm text-gray-600 hover:text-blue-600">Apply</Link>
        )}
        <span className="text-sm text-gray-500">
          {user?.username} <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full ml-1">{user?.role}</span>
        </span>
        <button onClick={logout} className="text-sm text-red-500 hover:underline">Logout</button>
      </div>
    </nav>
  );
}

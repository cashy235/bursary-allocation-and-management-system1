import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getCurrentUser, type User, type Role } from "./api";

interface AuthCtx { 
  user: User | null; 
  setUser: (u: User | null) => void;
  logout: () => void;
  loading: boolean;
}

const Ctx = createContext<AuthCtx>({ user: null, setUser: () => {}, logout: () => {}, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      getCurrentUser()
        .then((u) => setUser(u))
        .catch(() => {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const setUserWithStorage = (u: User | null) => {
    setUser(u);
    if (u) {
      localStorage.setItem("user", JSON.stringify(u));
    } else {
      localStorage.removeItem("user");
    }
  };

  return (
    <Ctx.Provider value={{ user, setUser: setUserWithStorage, logout, loading }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

export const hasRole = (user: User | null, roles: Role[]) => user && roles.includes(user.role);
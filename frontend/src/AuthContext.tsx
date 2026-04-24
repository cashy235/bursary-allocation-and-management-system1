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
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return null;
    try {
      return JSON.parse(stored) as User;
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }

    // Prevent infinite loading if request hangs in poor network conditions.
    const timeoutId = window.setTimeout(() => {
      if (isActive) setLoading(false);
    }, 8000);

    getCurrentUser()
      .then((u) => {
        if (!isActive) return;
        setUserWithStorage(u);
      })
      .catch(() => {
        if (!isActive) return;
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        setUser(null);
      })
      .finally(() => {
        if (!isActive) return;
        window.clearTimeout(timeoutId);
        setLoading(false);
      });

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
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
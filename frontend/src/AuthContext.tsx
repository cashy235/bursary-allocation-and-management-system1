import { createContext, useContext, useState, type ReactNode } from "react";
import type { User } from "./api";

interface AuthCtx { user: User | null; setUser: (u: User | null) => void; }
const Ctx = createContext<AuthCtx>({ user: null, setUser: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const s = localStorage.getItem("user");
    return s ? JSON.parse(s) : null;
  });
  const set = (u: User | null) => {
    setUser(u);
    u ? localStorage.setItem("user", JSON.stringify(u)) : localStorage.removeItem("user");
  };
  return <Ctx.Provider value={{ user, setUser: set }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);

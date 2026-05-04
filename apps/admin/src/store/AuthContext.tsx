/* EKLENDİ */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/* EKLENDİ */
const AUTH_STORAGE_KEY = "viptaksi-admin-authenticated";
/* EKLENDİ */
const TOKEN_STORAGE_KEY = "viptaksi-admin-token";
/* EKLENDİ */
const USER_STORAGE_KEY = "viptaksi-admin-user";

/* EKLENDİ */
export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

/* EKLENDİ */
type AuthContextValue = {
  isAuthenticated: boolean;
  token: string | null;
  user: AuthUser | null;
  isSuperAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
};

/* EKLENDİ */
const AuthContext = createContext<AuthContextValue | null>(null);

/* EKLENDİ */
function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/* EKLENDİ */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(AUTH_STORAGE_KEY) === "true";
  });
  /* EKLENDİ */
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  });
  /* EKLENDİ */
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());

  /* EKLENDİ */
  const login = useCallback(async (email: string, password: string) => {
    const apiBase = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
    if (!apiBase) {
      return false;
    }
    try {
      const r = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await r.json().catch(() => ({}))) as {
        token?: string;
        user?: AuthUser;
      };
      if (r.ok && data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        window.localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        window.localStorage.setItem("token", data.token);
        window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
        window.localStorage.setItem("adminUser", JSON.stringify(data.user));
        window.localStorage.setItem("loginTime", String(Date.now()));
        window.localStorage.setItem(AUTH_STORAGE_KEY, "true");
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  /* EKLENDİ */
  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setToken(null);
    setUser(null);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(USER_STORAGE_KEY);
      /* ADDED */
      window.localStorage.removeItem("token");
      /* ADDED */
      window.localStorage.removeItem("adminUser");
      /* ADDED */
      window.localStorage.removeItem("loginTime");
  }, []);

  /* EKLENDİ */
  const isSuperAdmin = user?.role === "super_admin";
  const value = useMemo(
    () => ({
      isAuthenticated,
      token,
      user,
      isSuperAdmin,
      login,
      logout,
    }),
    [isAuthenticated, token, user, isSuperAdmin, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

/* EKLENDİ */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

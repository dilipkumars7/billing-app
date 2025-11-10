import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CookieService } from "../store/Cookie";

type User = { username?: string } | null;

interface AuthContextType {
  user: User;
  isLoading: boolean;
  login: (payload: { username: string; token?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation(); // 🔹 Track current route
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getUserFromCookie = (): User => {
    const stored = CookieService.get("user");
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return { username: stored };
    }
  };

  // ✅ Initial load
  useEffect(() => {
    const initialUser = getUserFromCookie();
    setUser(initialUser);
    setIsLoading(false);
  }, []);

  // ✅ Sync cookie changes (optional polling)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentUser = getUserFromCookie();
      setUser((prevUser) => {
        const prevString = JSON.stringify(prevUser);
        const currString = JSON.stringify(currentUser);
        if (prevString !== currString) {
          console.log("🔁 Cookie changed → updating auth state");
          return currentUser;
        }
        return prevUser;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Redirect user if they’re logged in and open login page manually
  useEffect(() => {
    if (!isLoading && user && location.pathname === "/login") {
      console.log("🔐 User already logged in → redirecting to /dashboard");
      navigate("/dashboard", { replace: true });
    }
  }, [user, isLoading, location.pathname, navigate]);

  // ✅ Login
  const login = async (payload: { username: string; token?: string }) => {
    const userObj: User = { username: payload.username };
    CookieService.set("user", JSON.stringify(userObj), 7);
    if (payload.token) CookieService.set("authToken", payload.token, 7);

    setUser(userObj);
    navigate("/dashboard", { replace: true });
  };

  // ✅ Logout
  const logout = () => {
    setUser(null);
    CookieService.remove("user");
    CookieService.remove("authToken");
    navigate("/login", { replace: true });
  };

  const value = useMemo(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
};

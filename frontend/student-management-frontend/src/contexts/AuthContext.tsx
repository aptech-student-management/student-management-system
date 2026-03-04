import React, {
  useCallback,
  useEffect,
  useState,
  createContext,
  useContext,
  ReactNode
} from "react";

import type { User } from "../types";
import { loginApi } from "../services/authService";

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user từ localStorage khi app start
  useEffect(() => {
    const storedUser = localStorage.getItem("uni_user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

const login = useCallback(async (email: string, password: string) => {
  try {
    setIsLoading(true);

    const res = await loginApi(email, password);

    const { accessToken } = res.data;

    const payload = JSON.parse(atob(accessToken.split(".")[1]));

    const user: User = {
      email: payload.sub,
      role: payload.role
    } as User;

    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("uni_user", JSON.stringify(user));

    setCurrentUser(user);
    setIsLoading(false);

    return { success: true };

  }catch (error: any) {
  setIsLoading(false);

  if (error.response) {

    const data = error.response.data;
    if (typeof data === "object" && !data.error) {
      const firstError = Object.values(data)[0] as string;
      return { success: false, error: firstError };
    }

    return { success: false, error: data.error || "Lỗi không xác định" };
  }

  return { success: false, error: "Không kết nối được server" };
}
}, []);
  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("uni_user");
    setCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ currentUser, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
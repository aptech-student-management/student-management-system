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
import { getMyProfileApi } from "../services/userService";

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const profile = await getMyProfileApi();
    setCurrentUser(profile);
    localStorage.setItem("uni_user", JSON.stringify(profile));
  }, []);

  // Load user từ localStorage khi app start
  useEffect(() => {
    const hydrateUser = async () => {
      const token = localStorage.getItem("accessToken");
      const storedUser = localStorage.getItem("uni_user");

      if (!token) {
        setIsLoading(false);
        return;
      }

      if (storedUser) {
        try {
          setCurrentUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem("uni_user");
        }
      }

      try {
        await refreshProfile();
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("uni_user");
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void hydrateUser();
  }, [refreshProfile]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    if (currentUser?.role) {
      document.body.dataset.role = currentUser.role;
      document.documentElement.dataset.role = currentUser.role;
    } else {
      delete document.body.dataset.role;
      delete document.documentElement.dataset.role;
    }
  }, [currentUser?.role]);

const login = useCallback(async (email: string, password: string) => {
  try {
    setIsLoading(true);

    const res = await loginApi(email, password);
    const { accessToken } = res.data;

    localStorage.setItem("accessToken", accessToken);

    await refreshProfile();

    setIsLoading(false);
    return { success: true };
  } catch (error: any) {
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
}, [refreshProfile]);
  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("uni_user");
    setCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ currentUser, isLoading, login, logout, refreshProfile }}
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

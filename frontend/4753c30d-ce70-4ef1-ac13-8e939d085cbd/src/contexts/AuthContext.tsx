import React, {
  useCallback,
  useEffect,
  useState,
  createContext,
  useContext } from
'react';
import type { User } from '../types';
import { users } from '../data/mockData';
interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (
  email: string,
  password: string)
  => Promise<{
    success: boolean;
    error?: string;
  }>;
  logout: () => void;
}
const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: {children: ReactNode;}) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const stored = localStorage.getItem('uni_auth_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User;
        setCurrentUser(parsed);
      } catch {
        localStorage.removeItem('uni_auth_user');
      }
    }
    setIsLoading(false);
  }, []);
  const login = useCallback(
    async (
    email: string,
    password: string)
    : Promise<{
      success: boolean;
      error?: string;
    }> => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      const user = users.find(
        (u) => u.email === email && u.password === password
      );
      if (!user) {
        setIsLoading(false);
        return {
          success: false,
          error: 'Email hoặc mật khẩu không đúng'
        };
      }
      if (user.status === 'INACTIVE') {
        setIsLoading(false);
        return {
          success: false,
          error: 'Tài khoản đã bị vô hiệu hóa'
        };
      }
      const { password: _pwd, ...safeUser } = user;
      const userToStore = {
        ...safeUser,
        password: ''
      } as User;
      localStorage.setItem('uni_auth_user', JSON.stringify(userToStore));
      setCurrentUser(userToStore);
      setIsLoading(false);
      return {
        success: true
      };
    },
    []
  );
  const logout = useCallback(() => {
    localStorage.removeItem('uni_auth_user');
    setCurrentUser(null);
  }, []);
  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        login,
        logout
      }}>

      {children}
    </AuthContext.Provider>);

}
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
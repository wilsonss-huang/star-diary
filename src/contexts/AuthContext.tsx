import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  sendPhoneCode as cbSendCode,
  logout as cbLogout,
  getCurrentUser,
} from '../lib/cloudbase';

interface AuthUser {
  uid: string;
  phone: string;
}

interface AuthState {
  currentUser: AuthUser | null;
  isLoading: boolean;
  sendCode: (phoneNumber: string) => Promise<{ verifyOtp: (code: string) => Promise<void> }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

const CACHED_USER_KEY = 'star-diary-user';

function getCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(CACHED_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCachedUser(user: AuthUser | null): void {
  if (user) {
    localStorage.setItem(CACHED_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CACHED_USER_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 优先用 CloudBase 持久化的登录态，其次用 localStorage 缓存
    const cloudUser = getCurrentUser();
    const cachedUser = getCachedUser();
    if (cloudUser) {
      // CloudBase 恢复了登录态，补上 phone（可能丢失）
      const user = cloudUser.phone ? cloudUser : { ...cloudUser, phone: cachedUser?.phone || '' };
      setCurrentUser(user);
      setCachedUser(user);
    } else if (cachedUser) {
      setCurrentUser(cachedUser);
    }
    setIsLoading(false);
  }, []);

  const sendCode = useCallback(async (phoneNumber: string) => {
    const { verifyOtp } = await cbSendCode(phoneNumber);
    return {
      verifyOtp: async (code: string) => {
        const { uid } = await verifyOtp(code);
        const user = { uid, phone: phoneNumber };
        setCurrentUser(user);
        setCachedUser(user);
      },
    };
  }, []);

  const logout = useCallback(async () => {
    await cbLogout();
    setCurrentUser(null);
    setCachedUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, sendCode, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

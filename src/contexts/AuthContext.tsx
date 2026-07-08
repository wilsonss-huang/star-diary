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
  rememberedPhone: string | null;
  sendCode: (phoneNumber: string) => Promise<{ verifyOtp: (code: string) => Promise<void> }>;
  logout: () => Promise<void>;
  clearRemembered: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const CACHED_USER_KEY = 'star-diary-user';
const REMEMBERED_PHONE_KEY = 'star-diary-remembered-phone';

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

// 记忆数据：{ phone: string, uid: string } | 兼容旧格式纯字符串
interface RememberedData {
  phone: string;
  uid: string;
}

function getRememberedPhone(): string | null {
  try {
    const raw = localStorage.getItem(REMEMBERED_PHONE_KEY);
    if (!raw) return null;
    // 兼容旧格式：纯手机号字符串
    if (!raw.startsWith('{')) return raw;
    const data: RememberedData = JSON.parse(raw);
    return data.phone || null;
  } catch {
    return null;
  }
}

function setRememberedPhone(phone: string, uid?: string): void {
  try {
    const data: RememberedData = { phone, uid: uid || '' };
    localStorage.setItem(REMEMBERED_PHONE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

function clearRememberedPhone(): void {
  try {
    localStorage.removeItem(REMEMBERED_PHONE_KEY);
  } catch { /* ignore */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rememberedPhone, setRememberedPhoneState] = useState<string | null>(getRememberedPhone);

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
        // 去掉 +86 前缀统一存储
        const rawPhone = phoneNumber.replace(/^\+86/, '');
        const user = { uid, phone: rawPhone };
        setCurrentUser(user);
        setCachedUser(user);
        // 记住此设备登录过的手机号 + uid（用于一键登录恢复日记）
        setRememberedPhone(rawPhone, uid);
        setRememberedPhoneState(rawPhone);
      },
    };
  }, []);

  const logout = useCallback(async () => {
    await cbLogout();
    setCurrentUser(null);
    setCachedUser(null);
    // 退出登录不清除记忆的手机号，方便下次快速登录
  }, []);

  const clearRemembered = useCallback(() => {
    clearRememberedPhone();
    setRememberedPhoneState(null);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, rememberedPhone, sendCode, logout, clearRemembered }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

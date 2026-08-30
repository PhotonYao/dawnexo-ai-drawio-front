"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import LoginDialog from "./LoginDialog";
import { clearLoginUser, getLoginUser, saveLoginUser } from "../utils/cookie";
import {
  isValidLocale,
  LOCALE_STORAGE_KEY,
  PAGE_TITLES,
  type Locale,
} from "../config/i18n";
import type { LoginUser } from "../types/api";

interface AuthContextValue {
  /** 当前登录用户，未登录为 null */
  user: LoginUser | null;
  /** 是否已登录 */
  isLoggedIn: boolean;
  /** 退出登录 */
  logout: () => void;
  /** 当前界面语言 */
  locale: Locale;
  /** 切换界面语言（持久化到本地） */
  setLocale: (locale: Locale) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoggedIn: false,
  logout: () => {},
  locale: "zh",
  setLocale: () => {},
});

/** 获取登录态与语言偏好（需在 AuthGate 内使用） */
export function useAuth() {
  return useContext(AuthContext);
}

/**
 * 登录拦截 + 语言偏好组件：挂载时校验 cookie 中保存的登录信息，
 * 未登录时弹出登录弹窗并遮罩页面；同时管理界面语言并同步标签页标题。
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoginUser | null>(null);
  // 首次校验完成前不渲染内容，避免未登录状态闪现
  const [checked, setChecked] = useState(false);
  const [locale, setLocaleState] = useState<Locale>("zh");

  useEffect(() => {
    let cancelled = false;
    // 异步读取 cookie 与语言偏好，避免 SSR 水合不匹配
    Promise.resolve().then(() => {
      if (cancelled) return;
      setUser(getLoginUser());
      // 语言优先取本地存储，否则按浏览器语言
      const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (isValidLocale(stored)) {
        setLocaleState(stored);
      } else if (
        typeof navigator !== "undefined" &&
        navigator.language?.toLowerCase().startsWith("zh")
      ) {
        setLocaleState("zh");
      } else {
        setLocaleState("en");
      }
      setChecked(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // 语言变化时同步标签页标题与 <html lang>
  useEffect(() => {
    document.title = PAGE_TITLES[locale];
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // 存储不可用时仅切换当前会话语言
    }
  }, []);

  const handleLogin = useCallback((username: string) => {
    saveLoginUser(username);
    setUser(getLoginUser());
  }, []);

  const handleLogout = useCallback(() => {
    clearLoginUser();
    setUser(null);
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      isLoggedIn: !!user,
      logout: handleLogout,
      locale,
      setLocale,
    }),
    [user, handleLogout, locale, setLocale]
  );

  if (!checked) return null;

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      <LoginDialog open={!user} onLogin={handleLogin} />
    </AuthContext.Provider>
  );
}

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
import type { LoginUser } from "../types/api";

interface AuthContextValue {
  /** 当前登录用户，未登录为 null */
  user: LoginUser | null;
  /** 是否已登录 */
  isLoggedIn: boolean;
  /** 退出登录 */
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoggedIn: false,
  logout: () => {},
});

/** 获取登录态（需在 AuthGate 内使用） */
export function useAuth() {
  return useContext(AuthContext);
}

/**
 * 登录拦截组件：挂载时校验 cookie 中保存的登录信息，
 * 未登录时弹出登录弹窗并遮罩页面，登录成功后才放行。
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoginUser | null>(null);
  // 首次校验完成前不渲染内容，避免未登录状态闪现
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // 异步读取 cookie，避免 SSR 水合不匹配
    Promise.resolve().then(() => {
      if (cancelled) return;
      setUser(getLoginUser());
      setChecked(true);
    });
    return () => {
      cancelled = true;
    };
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
    () => ({ user, isLoggedIn: !!user, logout: handleLogout }),
    [user, handleLogout]
  );

  if (!checked) return null;

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      <LoginDialog open={!user} onLogin={handleLogin} />
    </AuthContext.Provider>
  );
}

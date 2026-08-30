"use client";

import { useMemo, useState } from "react";
import { useAuth } from "./AuthGate";
import { createT } from "../config/i18n";

// 演示账号（与后端 docs 登录页 login.html 保持一致）
const DEMO_USERNAME = "admin";
const DEMO_PASSWORD = "admin";

interface LoginDialogProps {
  open: boolean;
  /** 登录成功回调（username 为登录账号） */
  onLogin: (username: string) => void;
}

/** 登录弹窗：未登录时由 AuthGate 展示，风格与整体页面保持一致 */
export default function LoginDialog({ open, onLogin }: LoginDialogProps) {
  const { locale } = useAuth();
  const t = useMemo(() => createT(locale), [locale]);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const u = username.trim();
    const p = password.trim();
    if (!u || !p) {
      setError(t("login.errorRequired"));
      return;
    }
    setSubmitting(true);
    setError("");
    // 演示环境本地校验账号，与 login.html 行为一致
    setTimeout(() => {
      setSubmitting(false);
      if (u === DEMO_USERNAME && p === DEMO_PASSWORD) {
        onLogin(u);
      } else {
        setError(t("login.errorInvalid"));
      }
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 text-lg text-white shadow-sm">
            ✦
          </span>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t("login.title")}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t("login.subtitle")}
          </p>
        </div>
        <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-username" className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              {t("login.username")}
            </label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("login.usernamePlaceholder")}
              className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-800 outline-none transition-colors focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-password" className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              {t("login.password")}
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("login.passwordPlaceholder")}
              className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-800 outline-none transition-colors focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
          {error && <p className="text-center text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="h-10 rounded-md bg-blue-600 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? t("login.submitting") : t("login.submit")}
          </button>
          <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
            {t("login.demoHint")}
            <span className="font-medium text-zinc-500 dark:text-zinc-400">admin / admin</span>
          </p>
        </form>
      </div>
    </div>
  );
}

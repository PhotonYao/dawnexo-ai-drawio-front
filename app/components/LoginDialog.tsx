"use client";

import { useState } from "react";

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
      setError("请输入账号和密码");
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
        setError("账号或密码错误（演示账号 admin/admin）");
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
            登录 AI Draw.io 编辑器
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            请登录以继续使用智能体服务
          </p>
        </div>
        <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-username" className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              账号
            </label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入账号"
              className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-800 outline-none transition-colors focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-password" className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              密码
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-800 outline-none transition-colors focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
          {error && <p className="text-center text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="h-10 rounded-md bg-blue-600 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "登录中…" : "登 录"}
          </button>
          <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
            演示账号 / 密码：<span className="font-medium text-zinc-500 dark:text-zinc-400">admin / admin</span>
          </p>
        </form>
      </div>
    </div>
  );
}

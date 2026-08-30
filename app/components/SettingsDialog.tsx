"use client";

import { useEffect, useMemo } from "react";
import { useAuth } from "./AuthGate";
import { createT, LOCALE_LABELS, type Locale } from "../config/i18n";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

/** 设置弹窗：独立模态页，第一行为登录信息，后续可继续扩展设置项 */
export default function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const { user, logout, locale, setLocale } = useAuth();
  const t = useMemo(() => createT(locale), [locale]);

  // Escape 关闭
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !user) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t("settings.title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            title={t("common.cancel")}
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {/* 第一行：登录信息（退出登录按钮在用户信息右侧） */}
          <section className="px-6 py-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              {t("settings.account")}
            </h3>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-sm font-bold text-white">
                  {user.user.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {user.user}
                  </div>
                  <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {t("settings.loginAt")} {new Date(user.ts).toLocaleString()}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  logout();
                }}
                className="shrink-0 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {t("settings.logout")}
              </button>
            </div>
          </section>

          {/* 语言（下拉框在右侧） */}
          <section className="px-6 py-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              {t("settings.language")}
            </h3>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="min-w-0 text-sm text-zinc-500 dark:text-zinc-400">
                {t("settings.languageSubtitle")}
              </p>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
                title={t("settings.language")}
                className="h-9 w-32 shrink-0 rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-800 outline-none transition-colors focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              >
                {(Object.keys(LOCALE_LABELS) as Locale[]).map((key) => (
                  <option key={key} value={key}>
                    {LOCALE_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

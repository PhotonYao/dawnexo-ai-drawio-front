"use client";

import { useAuth } from "./AuthGate";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

/**
 * 侧边栏设置弹窗：由头部齿轮按钮触发。
 * 当前包含登录信息，后续可在 settings-body 中继续扩展其他设置项。
 */
export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { user, logout } = useAuth();
  if (!open || !user) return null;

  return (
    <>
      {/* 透明遮罩：点击面板外部关闭 */}
      <div className="fixed inset-0 z-30" onClick={onClose} aria-hidden="true" />
      <div className="absolute right-2 top-full z-40 mt-1 w-64 rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-900 dark:border-zinc-800 dark:text-zinc-50">
          设置
        </div>
        <div className="p-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            登录信息
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-bold text-white">
              {user.user.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {user.user}
              </div>
              <div className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                登录于 {new Date(user.ts).toLocaleString()}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              logout();
            }}
            className="mt-3 w-full rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            退出登录
          </button>
        </div>
      </div>
    </>
  );
}

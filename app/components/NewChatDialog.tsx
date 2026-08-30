"use client";

import { useMemo } from "react";
import { useAuth } from "./AuthGate";
import { createT } from "../config/i18n";

interface NewChatDialogProps {
  open: boolean;
  /** 先保存当前图表（下载 .drawio 文件）再新建 */
  onSaveAndNew: () => void;
  /** 不保存直接新建 */
  onDiscardAndNew: () => void;
  onCancel: () => void;
}

/** 新建对话确认弹窗：画布有内容时提示清空风险，并询问是否先保存 */
export default function NewChatDialog({
  open,
  onSaveAndNew,
  onDiscardAndNew,
  onCancel,
}: NewChatDialogProps) {
  const { locale } = useAuth();
  const t = useMemo(() => createT(locale), [locale]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {t("newChat.title")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          {t("newChat.body")}
        </p>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 rounded-md bg-zinc-100 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onDiscardAndNew}
            className="h-9 rounded-md bg-zinc-100 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {t("newChat.discardAndNew")}
          </button>
          <button
            type="button"
            onClick={onSaveAndNew}
            className="h-9 rounded-md bg-blue-600 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            {t("newChat.saveAndNew")}
          </button>
        </div>
      </div>
    </div>
  );
}

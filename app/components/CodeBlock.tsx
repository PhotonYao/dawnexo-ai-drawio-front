"use client";

import { useMemo, useState } from "react";
import { useAuth } from "./AuthGate";
import { createT } from "../config/i18n";

export type ContentSegment =
  | { type: "text"; text: string }
  | { type: "code"; code: string };

/** 将消息内容按 Markdown 围栏代码块（```...```）拆分为文本段与代码段 */
export function splitContentSegments(content: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  const pattern = /```[^\n]*\n?([\s\S]*?)```/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    if (match.index > last) {
      segments.push({ type: "text", text: content.slice(last, match.index) });
    }
    segments.push({ type: "code", code: match[1].replace(/\n$/, "") });
    last = pattern.lastIndex;
  }
  if (last < content.length) {
    segments.push({ type: "text", text: content.slice(last) });
  }
  return segments;
}

// 超过该字符数或行数的代码块自动折叠
const COLLAPSE_MAX_CHARS = 600;
const COLLAPSE_MAX_LINES = 12;
// 折叠 / 展开状态下的最大显示高度（px）
const COLLAPSED_HEIGHT = 180;
const EXPANDED_HEIGHT = 420;

/** 代码块展示组件：长代码默认折叠，支持展开 / 收起与复制 */
export function CodeBlock({ code }: { code: string }) {
  const { locale } = useAuth();
  const t = useMemo(() => createT(locale), [locale]);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const lineCount = code.split("\n").length;
  const collapsible =
    code.length > COLLAPSE_MAX_CHARS || lineCount > COLLAPSE_MAX_LINES;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 剪贴板不可用时静默失败
    }
  };

  return (
    <div className="mt-2 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 px-2.5 py-1 dark:border-zinc-700">
        <span className="shrink-0 text-[11px] text-zinc-500 dark:text-zinc-400">
          {t("code.lines", { n: lineCount })}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title={copied ? t("code.copied") : t("code.copy")}
            onClick={copy}
            className={`rounded p-0.5 transition-colors ${
              copied
                ? "text-green-500"
                : "text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            {copied ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
          {collapsible && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="rounded px-1.5 py-0.5 text-[11px] font-medium text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              {expanded ? t("code.collapse") : t("code.expand")}
            </button>
          )}
        </div>
      </div>
      <div className="relative">
        <pre
          className="overflow-auto px-2.5 py-2 text-xs leading-relaxed text-zinc-800 dark:text-zinc-200"
          style={{ maxHeight: collapsible && !expanded ? COLLAPSED_HEIGHT : EXPANDED_HEIGHT }}
        >
          <code className="font-mono whitespace-pre">{code}</code>
        </pre>
        {collapsible && !expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-zinc-50 to-transparent dark:from-zinc-950" />
        )}
      </div>
      {collapsible && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full border-t border-zinc-200 py-1 text-[11px] font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
        >
          {t("code.expandAll", { n: lineCount })}
        </button>
      )}
    </div>
  );
}

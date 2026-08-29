"use client";

import { useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  role: "user" | "agent";
  content: string;
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome",
    role: "agent",
    content: "你好，我是 AI 绘图助手。描述你想要的图表，我来帮你生成。",
  },
];

export default function ChatPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [width, setWidth] = useState(440);
  const MIN_WIDTH = 200;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number; startWidth: number } | null>(null);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 拖动左侧分隔条调节对话页宽度（带最小/最大宽度限制）
  const startResize = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragState.current = { startX: e.clientX, startWidth: width };
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const moveResize = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const delta = dragState.current.startX - e.clientX;
    const next = dragState.current.startWidth + delta;
    // 拖到最小宽度时自动收起侧边栏
    if (next <= MIN_WIDTH) {
      dragState.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setCollapsed(true);
      return;
    }
    // 最大宽度限制为网页宽度的 50%
    const maxWidth = window.innerWidth * 0.5;
    setWidth(Math.min(maxWidth, next));
  };

  const endResize = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    dragState.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };

  // Keep the message list scrolled to the latest message.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // 记录最后一个系统（agent）消息的索引，用于仅在其上显示「重新生成」按钮
  const lastAgentIndex = messages.reduce(
    (acc, m, i) => (m.role === "agent" ? i : acc),
    -1
  );

  const handleSend = () => {
    const text = input.trim();
    if (!text || pending) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setPending(true);

    // 模拟 agent 智能体回复（后续可替换为真实接口调用）
    pendingTimer.current = setTimeout(() => {
      const agentMsg: Message = {
        id: crypto.randomUUID(),
        role: "agent",
        content: `已收到你的请求：「${text}」。正在为你生成图表……（示例回复，可接入真实 AI 接口）`,
      };
      setMessages((prev) => [...prev, agentMsg]);
      setPending(false);
      pendingTimer.current = null;
    }, 600);
  };

  // 停止正在进行的生成（清空计时器并结束 pending 状态）
  const stopGeneration = () => {
    if (pendingTimer.current) {
      clearTimeout(pendingTimer.current);
      pendingTimer.current = null;
    }
    setPending(false);
  };

  // 输入框随内容自动增高（上限后滚动）
  const autoResize = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 复制消息内容到剪贴板，复制成功后短暂显示打勾状态
  const copyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 1500);
    } catch {
      // 剪贴板不可用时静默失败
    }
  };

  // 根据用户输入生成 / 重新生成 agent 响应：
  // - 若提供 targetAgentId，则替换该 agent 消息；否则在末尾追加一条新 agent 消息
  const regenerateResponse = (userText: string, targetAgentId?: string) => {
    if (pending) return;
    setPending(true);
    pendingTimer.current = setTimeout(() => {
      const agentMsg: Message = {
        id: crypto.randomUUID(),
        role: "agent",
        content: `已收到你的请求：「${userText}」。正在为你生成图表……（示例回复，可接入真实 AI 接口）`,
      };
      setMessages((prev) =>
        targetAgentId
          ? prev.map((m) => (m.id === targetAgentId ? agentMsg : m))
          : [...prev, agentMsg]
      );
      setPending(false);
      pendingTimer.current = null;
    }, 600);
  };

  // 重新生成指定 agent 消息的响应（基于其前最近的用户消息）
  const handleRetry = (agentId: string) => {
    if (pending) return;
    const idx = messages.findIndex((m) => m.id === agentId);
    if (idx === -1) return;
    let userText = "";
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        userText = messages[i].content;
        break;
      }
    }
    if (!userText) return;
    regenerateResponse(userText, agentId);
  };

  // 进入 / 保存 / 取消用户消息的编辑
  const startEdit = (msg: Message) => {
    setEditingId(msg.id);
    setEditText(msg.content);
  };

  const saveEdit = () => {
    const text = editText.trim();
    if (!text || !editingId) return;
    // 找到该用户消息之后紧跟的 agent 消息，以便重新生成其响应
    const userIdx = messages.findIndex((m) => m.id === editingId);
    let followingAgentId: string | undefined;
    for (let i = userIdx + 1; i < messages.length; i++) {
      if (messages[i].role === "agent") {
        followingAgentId = messages[i].id;
        break;
      }
    }
    setMessages((prev) =>
      prev.map((m) => (m.id === editingId ? { ...m, content: text } : m))
    );
    setEditingId(null);
    setEditText("");
    // 保存后重新发起请求（类似重试）
    regenerateResponse(text, followingAgentId);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        title="展开对话"
        className="flex w-10 shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <span className="text-lg">💬</span>
        <span
          className="text-xs font-medium tracking-widest text-zinc-500 dark:text-zinc-400"
          style={{ writingMode: "vertical-rl" }}
        >
          对话
        </span>
      </button>
    );
  }

  return (
    <div
      className="relative flex shrink-0 flex-col rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      style={{ width: `${width}px` }}
    >
      <div
        onPointerDown={startResize}
        onPointerMove={moveResize}
        onPointerUp={endResize}
        title="拖动调节宽度"
        className="group absolute -left-2 top-0 z-10 flex h-full w-2 cursor-col-resize items-center justify-center"
        style={{ touchAction: "none" }}
      >
        <div className="h-10 w-1 rounded-full bg-zinc-300 transition-colors group-hover:bg-zinc-400 dark:bg-zinc-700 dark:group-hover:bg-zinc-500" />
      </div>
      <div className="flex items-start justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            AI Draw.io 编辑器
          </h1>
          <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            对话
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          title="收起"
          className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div
        ref={listRef}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4"
      >
        {messages.map((msg, index) =>
          msg.role === "user" ? (
            <div key={msg.id} className="group flex flex-col items-end gap-1">
              {editingId === msg.id ? (
                <div className="flex w-full max-w-[85%] flex-col gap-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        saveEdit();
                      } else if (e.key === "Escape") {
                        cancelEdit();
                      }
                    }}
                    className="min-h-[60px] w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition-colors focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-md px-3 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={!editText.trim()}
                      className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      保存并提交
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-w-[85%] rounded-lg rounded-br-sm bg-blue-600 px-3 py-2 text-sm text-white">
                  {msg.content}
                </div>
              )}
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  title="编辑消息"
                  onClick={() => startEdit(msg)}
                  className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </button>
                <button
                  type="button"
                  title={copiedId === msg.id ? "已复制" : "复制消息"}
                  onClick={() => copyText(msg.content, msg.id)}
                  className={`rounded p-1 transition-colors ${
                    copiedId === msg.id
                      ? "text-green-500 hover:bg-green-100 dark:hover:bg-green-900/30"
                      : "text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                  }`}
                >
                  {copiedId === msg.id ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div key={msg.id} className="group flex flex-col items-start gap-1">
              <div className="max-w-[85%] rounded-lg rounded-bl-sm bg-zinc-100 px-3 py-2 text-sm text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
                {msg.content}
              </div>
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  title={copiedId === msg.id ? "已复制" : "复制消息"}
                  onClick={() => copyText(msg.content, msg.id)}
                  className={`rounded p-1 transition-colors ${
                    copiedId === msg.id
                      ? "text-green-500 hover:bg-green-100 dark:hover:bg-green-900/30"
                      : "text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                  }`}
                >
                  {copiedId === msg.id ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </button>
                {index === lastAgentIndex && (
                  <button
                    type="button"
                    title="重新生成响应"
                    onClick={() => handleRetry(msg.id)}
                    disabled={pending}
                    className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                      <path d="M21 3v5h-5" />
                      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                      <path d="M3 21v-5h5" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )
        )}
        {pending && (
          <div className="flex justify-start">
            <div className="rounded-lg rounded-bl-sm bg-zinc-100 px-3 py-2 text-sm text-zinc-400 dark:bg-zinc-800">
              正在输入…
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoResize();
            }}
            onKeyDown={handleKeyDown}
            placeholder="输入消息…"
            rows={1}
            className="max-h-[160px] min-h-[40px] flex-1 resize-none rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition-colors focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={pending ? stopGeneration : handleSend}
            disabled={!pending && !input.trim()}
            title={pending ? "停止生成" : "发送"}
            className="shrink-0 self-end rounded-md bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 2L11 13" />
                <path d="M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

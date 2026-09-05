"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  chat,
  chatStream,
  createSession,
  queryAgentConfigList,
} from "../api/agent";
import {
  downloadDrawioXml,
  hasDiagramContent,
} from "../utils/drawio";
import { parseAgentReply } from "../utils/chat";
import { generateId } from "../utils/uuid";
import {
  exampleText,
  QUICK_EXAMPLES,
  type QuickExample,
} from "../config/examples";
import { createT, type TFunc } from "../config/i18n";
import {
  listRecentChats,
  removeRecentChat,
  renameRecentChat,
  saveRecentChat,
  type RecentChat,
} from "../utils/recent-chats";
import type { AgentConfig } from "../types/api";
import { useAuth } from "./AuthGate";
import { CodeBlock, splitContentSegments } from "./CodeBlock";
import SettingsDialog from "./SettingsDialog";
import NewChatDialog from "./NewChatDialog";

type Message = {
  id: string;
  role: "user" | "agent";
  content: string;
  /** 附带的代码（如 AI 生成的 draw.io XML），在气泡中以可折叠代码块展示 */
  code?: string;
};

/** 执行轨迹行：流式生成期间按智能体分行展示各阶段实时输出（打字机） */
type AgentTraceRow = {
  author: string;
  stage: string;
  content: string;
};

/** 智能体名 -> i18n 显示名 key（未登记的智能体回退为去掉 agent_ 前缀的原名） */
const AGENT_LABEL_KEYS: Record<string, string> = {
  agent_analyst: "chat.agent.analyst",
  agent_drawer: "chat.agent.drawer",
  agent_reviewer: "chat.agent.reviewer",
};

/** 已登记的阶段（用于生成轨迹行状态文案） */
const KNOWN_STAGES = new Set(["analyze", "draw", "review"]);

/** 首次进入的欢迎消息（按当前语言生成） */
const initialMessages = (t: TFunc): Message[] => [
  { id: "welcome", role: "agent", content: t("chat.welcome") },
];

interface ChatPanelProps {
  /** AI 生成的图表 XML 回调，用于渲染到 draw.io 面板 */
  onDiagramXml?: (xml: string) => void;
  /** 获取当前画布 XML（新建对话前判断内容 / 保存用） */
  getCanvasXml?: () => string | null;
  /** 清空画布（新建对话时调用） */
  onClearCanvas?: () => void;
}

/** 格式化最近对话时间：当天显示 HH:mm，否则显示 M-D HH:mm */
function formatChatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const hm = `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
  if (d.toDateString() === now.toDateString()) return hm;
  return `${d.getMonth() + 1}-${d.getDate()} ${hm}`;
}

/** 取首条用户消息内容作为会话标题 */
function firstUserTitle(messages: Message[]): string | null {
  const first = messages.find((m) => m.role === "user");
  return first?.content ?? null;
}

export default function ChatPanel({
  onDiagramXml,
  getCanvasXml,
  onClearCanvas,
}: ChatPanelProps) {
  const { user, isLoggedIn, locale } = useAuth();
  const t = useMemo(() => createT(locale), [locale]);
  const [collapsed, setCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() =>
    initialMessages(t)
  );
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  // 流式对话的当前阶段（analyze/draw/review），空串表示未收到阶段事件
  const [pendingStage, setPendingStage] = useState("");
  // 流式生成期间的执行轨迹（按智能体分行，token 事件驱动打字机）
  const [agentTrace, setAgentTrace] = useState<AgentTraceRow[]>([]);
  const [width, setWidth] = useState(440);
  const MIN_WIDTH = 200;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // 设置弹窗（登录信息等）开关
  const [settingsOpen, setSettingsOpen] = useState(false);
  // 首次进入显示快速示例界面；发起对话或点击示例后进入对话界面
  const [showExamples, setShowExamples] = useState(true);
  // 新建对话确认弹窗（画布有内容时询问是否保存）
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);
  // 智能体列表与当前选中的智能体
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [agentsError, setAgentsError] = useState("");
  const [currentAgentId, setCurrentAgentId] = useState("");
  // 当前会话 ID（对话前若为空则自动创建）
  const sessionIdRef = useRef<string>("");
  // 当前会话 ID 的状态镜像（供渲染高亮与持久化使用）
  const [activeSessionId, setActiveSessionId] = useState("");
  // 最近对话列表（本地持久化，最多 20 条）
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
  // 最近对话列表的 ref 镜像（持久化时读取，避免引入循环依赖）
  const recentChatsRef = useRef<RecentChat[]>([]);
  // 正在重命名的最近对话 ID 与标题草稿
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState("");
  // 最近一次生成的图表 XML（持久化到最近对话，恢复画布用）
  const lastDiagramXmlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number; startWidth: number } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 读取本地最近对话并刷新列表状态与 ref 镜像
  const refreshRecentChats = useCallback((username: string) => {
    const list = listRecentChats(username);
    recentChatsRef.current = list;
    setRecentChats(list);
  }, []);

  // 最终气泡打字机动画定时器（组件卸载时清理）
  const typeTimerRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (typeTimerRef.current !== null) window.clearInterval(typeTimerRef.current);
    },
    []
  );

  // 智能体显示名：优先 i18n，未登记的回退为去掉 agent_ 前缀的原名
  const agentDisplayName = useCallback(
    (author: string) => {
      const key = AGENT_LABEL_KEYS[author];
      return key ? t(key) : author.replace(/^agent_/, "");
    },
    [t]
  );

  // 挂载后加载智能体配置列表与最近对话（未登录时不加载；登录态变化由 key 重挂载完成重置）
  useEffect(() => {
    if (!isLoggedIn || !user) return;
    let cancelled = false;
    // 异步读取本地最近对话，避免 effect 内同步 setState
    Promise.resolve().then(() => {
      if (cancelled) return;
      refreshRecentChats(user.user);
    });
    queryAgentConfigList()
      .then((list) => {
        if (cancelled) return;
        // 按智能体 ID 由小到大排序（数字感知比较，如 "9" < "100003"）
        const sorted = [...list].sort((a, b) =>
          a.agentId.localeCompare(b.agentId, undefined, { numeric: true })
        );
        setAgents(sorted);
        setCurrentAgentId((prev) => prev || sorted[0]?.agentId || "");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setAgentsError(err instanceof Error ? err.message : "智能体列表加载失败");
      });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, user, refreshRecentChats]);

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
  }, [messages, agentTrace]);

  // 记录最后一个系统（agent）消息的索引，用于仅在其上显示「重新生成」按钮
  const lastAgentIndex = messages.reduce(
    (acc, m, i) => (m.role === "agent" ? i : acc),
    -1
  );

  // 新增 / 替换 agent 消息：有 targetAgentId 时替换该消息，否则在末尾追加
  const upsertAgentMessage = (
    msg: { content: string; code?: string },
    targetAgentId?: string
  ) => {
    setMessages((prev) =>
      targetAgentId
        ? prev.map((m) => (m.id === targetAgentId ? { ...m, ...msg } : m))
        : [
            ...prev,
            {
              id: generateId(),
              role: "agent" as const,
              ...msg,
            },
          ]
    );
  };

  // 确保已有会话 ID，没有则先创建
  const ensureSession = async (): Promise<string> => {
    if (sessionIdRef.current) return sessionIdRef.current;
    const created = await createSession({
      agentId: currentAgentId,
      userId: user!.user,
    });
    sessionIdRef.current = created.sessionId;
    setActiveSessionId(created.sessionId);
    return created.sessionId;
  };

  // 调用智能体对话接口：返回内容若为 draw.io XML 则渲染到画布，否则作为文本展示。
  // 优先走 SSE 流式接口（阶段提示 + 画布草稿提前可见），流式建立失败时降级同步接口一次。
  const runChat = async (userText: string, targetAgentId?: string) => {
    if (pending) return;
    if (!isLoggedIn || !user) return;
    if (!currentAgentId) {
      upsertAgentMessage(
        {
          content: agentsError
            ? `${t("chat.agentError")}${agentsError}`
            : t("chat.noAgent"),
        },
        targetAgentId
      );
      return;
    }

    setPending(true);
    setPendingStage("");
    setAgentTrace([]);
    const controller = new AbortController();
    abortRef.current = controller;

    // 以打字机动画渐显最终气泡（重新生成/空文案时直接整段显示）
    const appendAgentMessageAnimated = (
      content: string,
      code?: string,
      replaceAgentId?: string
    ) => {
      if (typeTimerRef.current !== null) {
        window.clearInterval(typeTimerRef.current);
        typeTimerRef.current = null;
      }
      if (replaceAgentId || !content) {
        upsertAgentMessage(
          { content: content || t("chat.diagramReady"), ...(code ? { code } : {}) },
          replaceAgentId
        );
        return;
      }
      const id = generateId();
      setMessages((prev) => [
        ...prev,
        { id, role: "agent" as const, content: "", ...(code ? { code } : {}) },
      ]);
      // 约 60 帧内放完，长文本步进更大，短文本也有可感知的渐显
      const step = Math.max(1, Math.ceil(content.length / 60));
      let shown = 0;
      typeTimerRef.current = window.setInterval(() => {
        shown = Math.min(content.length, shown + step);
        const snapshot = content.slice(0, shown);
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, content: snapshot } : m))
        );
        if (shown >= content.length && typeTimerRef.current !== null) {
          window.clearInterval(typeTimerRef.current);
          typeTimerRef.current = null;
        }
      }, 24);
    };

    // 流式/同步回复的统一后处理：更新会话 ID、渲染画布、追加消息气泡
    const applyReply = (res: {
      type: string;
      explanation?: string;
      diagram?: string;
      sessionId?: string;
    }) => {
      // 收尾：执行轨迹完成使命，由正式气泡替代
      setAgentTrace([]);
      // 以服务端回传的会话 ID 为准（归属校验/自愈后可能已更新）
      if (res.sessionId && res.sessionId !== sessionIdRef.current) {
        sessionIdRef.current = res.sessionId;
        setActiveSessionId(res.sessionId);
      }
      // 解析回复：explanation 为说明/追问文本，diagram 为图表 XML，两者可同时存在（mixed）
      const reply = parseAgentReply(res.explanation, res.diagram);
      if (reply.kind === "user") {
        appendAgentMessageAnimated(reply.text || t("chat.emptyReply"), undefined, targetAgentId);
        // 聚焦输入框，方便用户补充信息
        inputRef.current?.focus();
      } else {
        lastDiagramXmlRef.current = reply.xml;
        onDiagramXml?.(reply.xml);
        appendAgentMessageAnimated(
          reply.text || t("chat.diagramReady"),
          reply.xml,
          targetAgentId
        );
      }
    };

    try {
      const sessionId = await ensureSession();
      const req = {
        agentId: currentAgentId,
        userId: user.user,
        sessionId,
        message: userText,
      };

      // 标记是否已收到过流式事件：有产出后断流应直接报错，而不是重发一遍同步请求
      let receivedEvent = false;
      try {
        const res = await chatStream(
          req,
          {
            onFirstEvent: () => {
              receivedEvent = true;
            },
            onStage: (author, stage) => {
              setPendingStage(stage);
              // 按智能体建立/更新轨迹行
              setAgentTrace((prev) => {
                const idx = prev.findIndex((r) => r.author === author);
                if (idx < 0) return [...prev, { author, stage, content: "" }];
                const next = [...prev];
                next[idx] = { ...next[idx], stage };
                return next;
              });
            },
            onToken: (author, stage, delta) => {
              // 增量文本追加到对应智能体的轨迹行（打字机效果）
              setAgentTrace((prev) => {
                const idx = prev.findIndex((r) => r.author === author);
                if (idx < 0) {
                  return [...prev, { author, stage, content: delta }];
                }
                const next = [...prev];
                next[idx] = {
                  ...next[idx],
                  stage: stage || next[idx].stage,
                  content: next[idx].content + delta,
                };
                return next;
              });
            },
            onDiagram: (xml) => {
              // 快照在流程结束时刻到达，直接上画布（page 的 seq 机制保证重复 XML 也会刷新）
              lastDiagramXmlRef.current = xml;
              onDiagramXml?.(xml);
            },
          },
          controller.signal
        );
        applyReply(res);
      } catch (streamErr) {
        // 用户主动停止生成时不追加错误消息
        if (streamErr instanceof Error && streamErr.name === "AbortError") {
          return;
        }
        // 流式尚未产生任何事件（连接失败/网关不支持等）→ 降级同步接口重试一次
        if (!receivedEvent) {
          const res = await chat(req, controller.signal);
          applyReply(res);
        } else {
          throw streamErr;
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      upsertAgentMessage(
        {
          content: `${t("chat.requestError")}${
            err instanceof Error ? err.message : t("chat.unknownError")
          }`,
        },
        targetAgentId
      );
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setPending(false);
      setPendingStage("");
      setAgentTrace([]);
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || pending) return;

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setShowExamples(false);
    void runChat(text);
  };

  // 停止正在进行的生成（中断请求并结束 pending 状态）
  const stopGeneration = () => {
    abortRef.current?.abort();
  };

  // 切换智能体后清空会话，下次对话时重新创建
  const handleAgentChange = (agentId: string) => {
    setCurrentAgentId(agentId);
    sessionIdRef.current = "";
  };

  // 回到快速示例界面：清空会话与消息，并清空画布（saveCanvas 为 true 时先下载保存当前图表）
  const resetToExamples = (saveCanvas = false) => {
    abortRef.current?.abort();
    if (saveCanvas) {
      const xml = getCanvasXml?.();
      if (xml) downloadDrawioXml(xml);
    }
    onClearCanvas?.();
    sessionIdRef.current = "";
    setActiveSessionId("");
    lastDiagramXmlRef.current = null;
    setMessages(initialMessages(t));
    setShowExamples(true);
  };

  // 新建对话：画布有内容时先弹窗询问是否保存
  const handleNewChat = () => {
    if (hasDiagramContent(getCanvasXml?.())) {
      setNewChatDialogOpen(true);
      return;
    }
    resetToExamples();
  };

  // 点击快速示例：本地生成示例对话并渲染画布（不请求消息接口），
  // 同时创建 SessionID，便于后续在该会话中继续对话
  const handleExample = (example: QuickExample) => {
    onDiagramXml?.(example.xml);
    lastDiagramXmlRef.current = example.xml;
    setShowExamples(false);
    setMessages([
      {
        id: generateId(),
        role: "user",
        content: exampleText(t, example.id, "prompt"),
      },
      {
        id: generateId(),
        role: "agent",
        content: exampleText(t, example.id, "reply"),
        code: example.xml,
      },
    ]);
    if (isLoggedIn && user && currentAgentId) {
      createSession({ agentId: currentAgentId, userId: user.user })
        .then((created) => {
          sessionIdRef.current = created.sessionId;
          setActiveSessionId(created.sessionId);
        })
        .catch(() => {
          // 创建失败不阻断示例展示，后续发送消息时会自动重试创建
        });
    }
  };

  // 对话消息变化时持久化到「最近对话」（最多 20 条，超出自动淘汰最旧记录）
  useEffect(() => {
    if (!user || showExamples) return;
    if (!activeSessionId || messages.length === 0) return;
    const agent = agents.find((a) => a.agentId === currentAgentId);
    const existing = recentChatsRef.current.find(
      (c) => c.sessionId === activeSessionId
    );
    // 用户重命名过的标题不再被首条用户消息覆盖
    const renamed = existing?.renamed ?? false;
    const chat: Omit<RecentChat, "updatedAt"> = {
      sessionId: activeSessionId,
      agentId: currentAgentId,
      agentName: agent?.agentName ?? "",
      title:
        renamed && existing
          ? existing.title
          : (firstUserTitle(messages) ?? t("chat.defaultTitle")).slice(0, 30),
      renamed,
      messages,
      lastXml: lastDiagramXmlRef.current,
    };
    saveRecentChat(user.user, chat);
    Promise.resolve().then(() => {
      refreshRecentChats(user.user);
    });
  }, [
    messages,
    user,
    showExamples,
    agents,
    currentAgentId,
    activeSessionId,
    refreshRecentChats,
    t,
  ]);

  // 打开最近对话：恢复消息与画布，并复用其会话 ID
  const handleOpenRecent = (chat: RecentChat) => {
    if (pending) return;
    setShowExamples(false);
    setMessages(chat.messages);
    lastDiagramXmlRef.current = chat.lastXml;
    sessionIdRef.current = chat.sessionId;
    setActiveSessionId(chat.sessionId);
    // 智能体仍存在时复用其会话，否则回退到第一个可用智能体并重建会话
    if (agents.some((a) => a.agentId === chat.agentId)) {
      setCurrentAgentId(chat.agentId);
    } else {
      setCurrentAgentId(agents[0]?.agentId ?? "");
      sessionIdRef.current = "";
      setActiveSessionId("");
    }
    if (chat.lastXml) onDiagramXml?.(chat.lastXml);
  };

  // 进入重命名状态
  const startRename = (chat: RecentChat) => {
    setRenamingId(chat.sessionId);
    setRenameText(chat.title);
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameText("");
  };

  // 保存重命名后的标题
  const saveRename = () => {
    const title = renameText.trim();
    if (!renamingId || !title || !user) {
      cancelRename();
      return;
    }
    renameRecentChat(user.user, renamingId, title);
    refreshRecentChats(user.user);
    cancelRename();
  };

  // 删除一条最近对话（仅移除记录本身，不影响进行中的会话）
  const handleDeleteRecent = (chat: RecentChat) => {
    if (!user) return;
    removeRecentChat(user.user, chat.sessionId);
    refreshRecentChats(user.user);
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
    void runChat(userText, agentId);
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
    void runChat(text, followingAgentId);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  // 渲染消息内容：附带代码的消息（如 AI 生成的 XML）以可折叠代码块展示，
  // 普通消息中的 Markdown 围栏代码块超过长度也会自动折叠
  const renderContent = (msg: Message) => {
    if (msg.code) {
      return (
        <>
          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
          <CodeBlock code={msg.code} />
        </>
      );
    }
    return splitContentSegments(msg.content).map((seg, i) =>
      seg.type === "code" ? (
        <CodeBlock key={i} code={seg.code} />
      ) : (
        <p key={i} className="whitespace-pre-wrap break-words">
          {seg.text}
        </p>
      )
    );
  };

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        title={t("chat.expand")}
        className="flex w-10 shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <span className="text-lg">💬</span>
        <span
          className="text-xs font-medium tracking-widest text-zinc-500 dark:text-zinc-400"
          style={{ writingMode: "vertical-rl" }}
        >
          {t("chat.tab")}
        </span>
      </button>
    );
  }

  return (
    <div
      className="relative flex min-h-0 shrink-0 flex-col rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      style={{ width: `${width}px` }}
    >
      {/* 拖拽把手：位于侧边栏边线左侧的间隙中 */}
      <div
        onPointerDown={startResize}
        onPointerMove={moveResize}
        onPointerUp={endResize}
        title={t("chat.resizeTitle")}
        className="group absolute -left-3 top-0 z-10 flex h-full w-3 cursor-col-resize items-center justify-center"
        style={{ touchAction: "none" }}
      >
        <div className="h-10 w-1 rounded-full bg-zinc-300 transition-colors group-hover:bg-blue-400 dark:bg-zinc-700 dark:group-hover:bg-blue-500" />
      </div>
      <div className="relative flex items-center justify-between gap-2 border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-800">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 text-sm text-white shadow-sm"
            aria-hidden="true"
          >
            ✦
          </span>
          <h1 className="min-w-0 truncate text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t("app.title")}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            title={t("settings.title")}
            aria-expanded={settingsOpen}
            className={`rounded-md p-1.5 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 ${
              settingsOpen
                ? "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            title={t("chat.collapse")}
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
        <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
      <div className="flex items-center gap-2 border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <select
          value={currentAgentId}
          onChange={(e) => handleAgentChange(e.target.value)}
          title={t("chat.selectAgent")}
          className="h-7 min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-1.5 text-xs text-zinc-800 outline-none transition-colors focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        >
          {agents.length === 0 && (
            <option value="">
              {agentsError ? t("chat.agentsFailed") : t("chat.agentsLoading")}
            </option>
          )}
          {agents.map((agent) => (
            <option key={agent.agentId} value={agent.agentId}>
              {agent.agentName}
              {agent.agentDesc ? `（${agent.agentDesc}）` : ""}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleNewChat}
          disabled={pending}
          title={t("chat.newTitle")}
          className="shrink-0 rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          {t("chat.new")}
        </button>
      </div>

      {showExamples ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {t("chat.quickExamples")}
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {t("chat.quickExamplesDesc")}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {QUICK_EXAMPLES.map((example) => (
              <button
                key={example.id}
                type="button"
                onClick={() => handleExample(example)}
                className="rounded-lg border border-zinc-200 p-3 text-left transition-colors hover:border-blue-400 hover:bg-blue-50/60 dark:border-zinc-700 dark:hover:border-blue-500 dark:hover:bg-blue-950/40"
              >
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {exampleText(t, example.id, "title")}
                </div>
                <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {exampleText(t, example.id, "description")}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-5">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {t("chat.recentChats")}
            </h2>
            {recentChats.length === 0 ? (
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {t("chat.recentEmpty")}
              </p>
            ) : (
              <div className="mt-2 flex flex-col gap-2">
                {recentChats.map((chat) => {
                  const active = chat.sessionId === activeSessionId;
                  const renaming = renamingId === chat.sessionId;
                  return (
                    <div
                      key={chat.sessionId}
                      role="button"
                      tabIndex={renaming ? -1 : 0}
                      title={renaming ? undefined : chat.title}
                      onClick={() => {
                        if (!renaming) handleOpenRecent(chat);
                      }}
                      onKeyDown={(e) => {
                        if (
                          !renaming &&
                          (e.key === "Enter" || e.key === " ")
                        ) {
                          e.preventDefault();
                          handleOpenRecent(chat);
                        }
                      }}
                      className={`group cursor-pointer rounded-lg border p-3 text-left transition-colors ${
                        active
                          ? "border-blue-400 bg-blue-50/60 dark:border-blue-500 dark:bg-blue-950/40"
                          : "border-zinc-200 hover:border-blue-400 hover:bg-blue-50/60 dark:border-zinc-700 dark:hover:border-blue-500 dark:hover:bg-blue-950/40"
                      }`}
                    >
                      {renaming ? (
                        <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            autoFocus
                            value={renameText}
                            onChange={(e) => setRenameText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                saveRename();
                              } else if (e.key === "Escape") {
                                cancelRename();
                              }
                            }}
                            placeholder={t("chat.renamePlaceholder")}
                            className="h-8 w-full rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-800 outline-none transition-colors focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={cancelRename}
                              className="rounded-md px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            >
                              {t("common.cancel")}
                            </button>
                            <button
                              type="button"
                              onClick={saveRename}
                              disabled={!renameText.trim()}
                              className="rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {t("common.save")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between gap-2">
                            <span className="min-w-0 truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                              {chat.title}
                            </span>
                            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                type="button"
                                title={t("chat.rename")}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startRename(chat);
                                }}
                                className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M12 20h9" />
                                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                title={t("chat.delete")}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteRecent(chat);
                                }}
                                className="rounded p-1 text-zinc-400 transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M3 6h18" />
                                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <div className="mt-0.5 flex items-center justify-between gap-2">
                            <span className="min-w-0 truncate text-xs text-zinc-500 dark:text-zinc-400">
                              {chat.agentName || t("chat.unknownAgent")} ·{" "}
                              {t("chat.sessionLabel")}{" "}
                              {chat.sessionId.slice(0, 8)}
                            </span>
                            <span className="shrink-0 text-[11px] text-zinc-400 dark:text-zinc-500">
                              {formatChatTime(chat.updatedAt)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
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
                      {t("common.cancel")}
                    </button>
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={!editText.trim()}
                      className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {t("chat.saveAndSubmit")}
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
                  title={t("chat.editMessage")}
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
                  title={copiedId === msg.id ? t("chat.copied") : t("chat.copy")}
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
                {renderContent(msg)}
              </div>
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  title={copiedId === msg.id ? t("chat.copied") : t("chat.copy")}
                  onClick={() => copyText(msg.code ?? msg.content, msg.id)}
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
                    title={t("chat.regenerate")}
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
        {pending && agentTrace.length > 0 && (
          <div className="flex justify-start">
            <div className="w-[88%] max-w-[88%] space-y-2 rounded-lg rounded-bl-sm bg-zinc-100 px-3 py-2 dark:bg-zinc-800">
              {agentTrace.map((row) => (
                <div key={row.author}>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
                    {agentDisplayName(row.author)}
                    <span className="text-zinc-300 dark:text-zinc-600">·</span>
                    <span className="font-normal text-zinc-400 dark:text-zinc-500">
                      {KNOWN_STAGES.has(row.stage)
                        ? t(`chat.stage.${row.stage}`)
                        : t("chat.generating")}
                    </span>
                  </div>
                  <div className="mt-0.5 max-h-24 overflow-y-auto whitespace-pre-wrap break-all text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
                    {row.content}
                    <span className="animate-pulse">▋</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {pending && agentTrace.length === 0 && (
          <div className="flex justify-start">
            <div className="rounded-lg rounded-bl-sm bg-zinc-100 px-3 py-2 text-sm text-zinc-400 dark:bg-zinc-800">
              {pendingStage
                ? t(`chat.stage.${pendingStage}`)
                : t("chat.generating")}
            </div>
          </div>
        )}
      </div>
      )}

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
            placeholder={t("chat.placeholder")}
            rows={1}
            className="max-h-[160px] min-h-[40px] flex-1 resize-none rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition-colors focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={pending ? stopGeneration : handleSend}
            disabled={!pending && !input.trim()}
            title={pending ? t("chat.stop") : t("chat.send")}
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
      <NewChatDialog
        open={newChatDialogOpen}
        onSaveAndNew={() => {
          setNewChatDialogOpen(false);
          resetToExamples(true);
        }}
        onDiscardAndNew={() => {
          setNewChatDialogOpen(false);
          resetToExamples(false);
        }}
        onCancel={() => setNewChatDialogOpen(false)}
      />
    </div>
  );
}

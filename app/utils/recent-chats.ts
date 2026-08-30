/**
 * 最近对话本地存储（localStorage，按用户隔离）。
 * 最多保留 20 条，超出时按更新时间淘汰最旧记录；写入配额不足时同样逐条淘汰重试。
 */

// 最大保留的最近对话条数
const MAX_RECENT_CHATS = 20;
// 单个对话最多保留的消息数（防止超大 XML 撑爆存储）
const MAX_MESSAGES_PER_CHAT = 50;
const STORAGE_KEY_PREFIX = "ai_drawio_recent_chats:";

/** 最近对话中保存的单条消息（与 ChatPanel 的 Message 结构一致） */
export interface RecentChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  code?: string;
}

/** 最近对话条目 */
export interface RecentChat {
  /** 会话 ID（可唯一定位一次对话） */
  sessionId: string;
  agentId: string;
  agentName: string;
  /** 会话标题（取首条用户消息截断） */
  title: string;
  /** 最近更新时间戳 */
  updatedAt: number;
  messages: RecentChatMessage[];
  /** 最近一次生成的图表 XML（恢复画布用） */
  lastXml: string | null;
}

function storageKey(username: string): string {
  return STORAGE_KEY_PREFIX + username;
}

/** 读取某用户的最近对话列表（按更新时间倒序） */
export function listRecentChats(username: string): RecentChat[] {
  if (!username || typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(username));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentChat[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((c) => c && c.sessionId)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

/** 新增 / 更新一条最近对话（按 sessionId 去重），并持久化；updatedAt 以保存时刻为准 */
export function saveRecentChat(
  username: string,
  chat: Omit<RecentChat, "updatedAt">
): void {
  if (!username || typeof window === "undefined" || !chat.sessionId) return;
  const trimmed: RecentChat = {
    ...chat,
    updatedAt: Date.now(),
    messages: chat.messages.slice(-MAX_MESSAGES_PER_CHAT),
  };
  const list = listRecentChats(username).filter(
    (c) => c.sessionId !== chat.sessionId
  );
  list.unshift(trimmed);
  list.sort((a, b) => b.updatedAt - a.updatedAt);
  // 超出上限或写入配额不足时，从最旧的开始淘汰重试
  const maxSize = Math.min(list.length, MAX_RECENT_CHATS);
  for (let size = maxSize; size >= 1; size--) {
    try {
      window.localStorage.setItem(
        storageKey(username),
        JSON.stringify(list.slice(0, size))
      );
      return;
    } catch {
      // 配额不足，继续淘汰最旧记录
    }
  }
  try {
    window.localStorage.removeItem(storageKey(username));
  } catch {
    // 忽略清理失败
  }
}

/** 删除某条最近对话 */
export function removeRecentChat(username: string, sessionId: string): void {
  if (!username || typeof window === "undefined") return;
  const list = listRecentChats(username).filter(
    (c) => c.sessionId !== sessionId
  );
  try {
    window.localStorage.setItem(storageKey(username), JSON.stringify(list));
  } catch {
    // 忽略写入失败
  }
}

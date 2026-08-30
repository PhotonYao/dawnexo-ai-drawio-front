/** 后端统一响应结构 */
export interface ApiResponse<T = unknown> {
  code: string;
  info: string;
  data: T | null;
}

/** 智能体配置信息 */
export interface AgentConfig {
  agentId: string;
  agentName: string;
  agentDesc: string;
}

/** 创建会话请求参数 */
export interface CreateSessionRequest {
  agentId: string;
  userId: string;
}

/** 创建会话返回结果 */
export interface CreateSessionData {
  sessionId: string;
}

/** 智能体对话请求参数 */
export interface ChatRequest {
  agentId: string;
  userId: string;
  sessionId: string;
  message: string;
}

/**
 * 智能体对话返回结果
 * - type = "user"：向用户追问，content 为对话文本（提示用户补充信息）
 * - type = "drawio"：content 为 draw.io XML，渲染到画布并展示在消息中
 * - sessionId：服务端归属校验/自愈后实际使用的会话 ID，前端以此为准
 */
export interface ChatData {
  type: string;
  content: string;
  sessionId?: string;
}

/** 登录用户信息（保存在 cookie 中） */
export interface LoginUser {
  user: string;
  ts: number;
}

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
 * 智能体对话返回结果（三字段结构，文本说明与图表数据分离）
 * - type = "user"：向用户追问，explanation 为对话文本（提示用户补充信息）
 * - type = "drawio"：diagram 为 draw.io XML，渲染到画布并展示在消息中
 * - type = "mixed"：explanation 与 diagram 同时存在（说明文字 + 图表数据）
 * - sessionId：服务端归属校验/自愈后实际使用的会话 ID，前端以此为准
 */
export interface ChatData {
  type: string;
  explanation?: string;
  diagram?: string;
  sessionId?: string;
}

/** 登录用户信息（保存在 cookie 中） */
export interface LoginUser {
  user: string;
  ts: number;
}

/**
 * chat_stream SSE 事件负载（与后端 ChatStreamEvent 对应，data 为 JSON）
 * - stage: 工作流阶段推进（analyze/draw/review），author 为当前智能体名
 * - token: 流式增量文本（author + stage + delta），前端做打字机效果
 * - diagram: 完整且后端已校验的 XML 快照（draft 草稿 / final 终稿），画布可直接加载
 * - message: 给用户阅读的完整文本
 * - done: 正常结束，sessionId 为自愈后实际会话 ID
 * - error: 失败说明
 */
export interface ChatStreamPayload {
  type: "stage" | "token" | "diagram" | "message" | "done" | "error";
  author?: string;
  stage?: string;
  delta?: string;
  phase?: "draft" | "final";
  xml?: string;
  responseType?: string;
  explanation?: string;
  sessionId?: string;
  message?: string;
}

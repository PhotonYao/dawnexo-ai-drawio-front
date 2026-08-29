import { API_ENDPOINTS, buildApiUrl } from "../config/api-config";
import type {
  AgentConfig,
  ApiResponse,
  ChatData,
  ChatRequest,
  CreateSessionData,
  CreateSessionRequest,
} from "../types/api";

// 后端约定的成功响应码
const SUCCESS_CODE = "0000";

/** 统一请求封装：解析统一响应结构，非成功码或网络异常时抛出错误 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(buildApiUrl(path), {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch (error) {
    // 主动中断的请求原样抛出，由调用方判断处理
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new Error("网络错误：无法连接服务端，请确认服务已启动");
  }
  if (!response.ok) {
    throw new Error(`服务端响应异常（HTTP ${response.status}）`);
  }
  const body = (await response.json()) as ApiResponse<T>;
  if (body.code !== SUCCESS_CODE || body.data === null || body.data === undefined) {
    throw new Error(body.info || "接口返回异常");
  }
  return body.data;
}

/** 查询智能体配置列表 */
export function queryAgentConfigList(): Promise<AgentConfig[]> {
  return request<AgentConfig[]>(API_ENDPOINTS.queryAgentConfigList, {
    method: "GET",
  });
}

/** 创建会话（GET 请求，参数通过 query 传递），返回新的 sessionId */
export function createSession(
  req: CreateSessionRequest
): Promise<CreateSessionData> {
  const query = `agentId=${encodeURIComponent(req.agentId)}&userId=${encodeURIComponent(req.userId)}`;
  return request<CreateSessionData>(
    `${API_ENDPOINTS.createSession}?${query}`,
    { method: "GET" }
  );
}

/** 智能体对话，返回的 content 为 draw.io XML（signal 用于停止生成） */
export function chat(req: ChatRequest, signal?: AbortSignal): Promise<ChatData> {
  return request<ChatData>(API_ENDPOINTS.chat, {
    method: "POST",
    body: JSON.stringify(req),
    signal,
  });
}

import { API_ENDPOINTS, buildApiUrl } from "../config/api-config";
import type {
  AgentConfig,
  ApiResponse,
  ChatData,
  ChatRequest,
  ChatStreamPayload,
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

/** 智能体对话，返回 {type, explanation, diagram}（signal 用于停止生成） */
export function chat(req: ChatRequest, signal?: AbortSignal): Promise<ChatData> {
  return request<ChatData>(API_ENDPOINTS.chat, {
    method: "POST",
    body: JSON.stringify(req),
    signal,
  });
}

/** chat_stream 各事件的回调集合 */
export interface ChatStreamHandlers {
  /** 收到任意事件时触发一次（用于判断"是否已有产出"来决定降级） */
  onFirstEvent?: () => void;
  /** 工作流阶段推进（author 智能体名，stage: analyze/draw/review） */
  onStage?: (author: string, stage: string) => void;
  /** 流式增量文本（author 智能体名），驱动打字机效果 */
  onToken?: (author: string, stage: string, delta: string) => void;
  /** 校验通过的完整 XML 快照（draft 草稿 / final 终稿），画布可立即加载 */
  onDiagram?: (xml: string, phase: string) => void;
}

/**
 * 智能体流式对话（SSE）。
 * fetch 流式读取 + 手动分帧解析 event:/data: 行；收到 done 时以聚合出的最终
 * ChatData（type/explanation/diagram/sessionId）resolve，收到 error 时 reject。
 * 事件中途失败（已有产出后断流）同样 reject，由调用方决定是否降级。
 */
export async function chatStream(
  req: ChatRequest,
  handlers: ChatStreamHandlers,
  signal?: AbortSignal
): Promise<ChatData> {
  let response: Response;
  try {
    response = await fetch(buildApiUrl(API_ENDPOINTS.chatStream), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(req),
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new Error("网络错误：无法连接服务端，请确认服务已启动");
  }
  if (!response.ok || !response.body) {
    throw new Error(`服务端响应异常（HTTP ${response.status}）`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  // 聚合出的最终回复（由 message/diagram/done 事件共同构成）
  let result: ChatData | null = null;
  let errorMessage = "";
  let firstEventFired = false;

  const fireFirst = () => {
    if (!firstEventFired) {
      firstEventFired = true;
      handlers.onFirstEvent?.();
    }
  };

  const handleEvent = (name: string, data: string) => {
    if (!data) return;
    let payload: ChatStreamPayload;
    try {
      payload = JSON.parse(data) as ChatStreamPayload;
    } catch {
      return;
    }
    fireFirst();
    switch (payload.type) {
      case "stage":
        handlers.onStage?.(payload.author ?? "", payload.stage ?? "");
        break;
      case "token":
        if (payload.delta) {
          handlers.onToken?.(payload.author ?? "", payload.stage ?? "", payload.delta);
        }
        break;
      case "diagram":
        if (payload.xml) {
          handlers.onDiagram?.(payload.xml, payload.phase ?? "final");
          result = { ...(result ?? { type: "drawio" }), diagram: payload.xml };
        }
        break;
      case "message":
        result = {
          ...(result ?? { type: payload.responseType ?? "user" }),
          type: payload.responseType ?? result?.type ?? "user",
          explanation: payload.explanation ?? result?.explanation ?? "",
        };
        break;
      case "done":
        result = {
          type: payload.responseType ?? result?.type ?? "user",
          explanation: result?.explanation,
          diagram: result?.diagram,
          sessionId: payload.sessionId,
        };
        break;
      case "error":
        errorMessage = payload.message || "生成失败";
        break;
    }
  };

  // 按空行分帧，逐帧解析 event:/data: 行（":" 开头为心跳注释帧，忽略）
  const processFrame = (frame: string) => {
    let eventName = "message";
    const dataLines: string[] = [];
    for (const line of frame.split("\n")) {
      if (line.startsWith(":") || !line.trim()) continue;
      if (line.startsWith("event:")) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trimStart());
      }
    }
    if (dataLines.length > 0) {
      handleEvent(eventName, dataLines.join("\n"));
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) >= 0) {
      processFrame(buffer.slice(0, idx));
      buffer = buffer.slice(idx + 2);
    }
  }
  // 处理最后残帧
  if (buffer.trim()) processFrame(buffer);

  if (errorMessage) {
    throw new Error(errorMessage);
  }
  if (!result) {
    throw new Error("连接中断：未收到完整回复");
  }
  return result;
}

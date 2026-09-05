/**
 * 统一管理后端 API 地址与登录配置
 * 修改 API_BASE 可切换后端服务地址
 */

// 后端服务根地址
// 默认空串 = 同源相对路径：浏览器请求本站点的 /api/v1/*，
// 由服务器上的 nginx 按 location ^~ /api/ 转发到后端，前端不写死任何地址。
// 仅前后端分域名部署时才需要构建期注入 NEXT_PUBLIC_API_BASE 指定绝对地址。
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

// 接口前缀
export const API_PREFIX = "/api/v1";

// 登录态 cookie 名称（与后端 login.html 保持一致）
export const LOGIN_COOKIE = "ai_agent_login";

// 登录 cookie 有效期（天）
export const LOGIN_COOKIE_MAX_AGE_DAYS = 7;

// 各接口地址（基于 API_BASE + API_PREFIX 拼接）
export const API_ENDPOINTS = {
  // 查询智能体配置列表
  queryAgentConfigList: "/query_ai_agent_config_list",
  // 创建会话
  createSession: "/create_session",
  // 智能体对话（同步，作为流式失败时的降级通道）
  chat: "/chat",
  // 智能体对话（SSE 流式）
  chatStream: "/chat_stream",
} as const;

/** 拼接完整接口地址 */
export const buildApiUrl = (path: string) => `${API_BASE}${API_PREFIX}${path}`;

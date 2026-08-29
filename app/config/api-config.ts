/**
 * 统一管理后端 API 地址与登录配置
 * 修改 API_BASE 可切换后端服务地址
 */

// 后端服务根地址
export const API_BASE = "http://127.0.0.1:8090";

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
  // 智能体对话
  chat: "/chat",
} as const;

/** 拼接完整接口地址 */
export const buildApiUrl = (path: string) => `${API_BASE}${API_PREFIX}${path}`;

import { LOGIN_COOKIE, LOGIN_COOKIE_MAX_AGE_DAYS } from "../config/api-config";
import type { LoginUser } from "../types/api";

/** 读取 cookie 值，不存在时返回 null */
export function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[2]) : null;
}

/** 写入 cookie（按天设置有效期） */
export function setCookie(name: string, value: string, maxAgeDays: number): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeDays * 24 * 60 * 60}`;
}

/** 删除 cookie */
export function removeCookie(name: string): void {
  document.cookie = `${name}=; path=/; max-age=0`;
}

/** 读取登录用户信息，未登录或数据损坏时返回 null */
export function getLoginUser(): LoginUser | null {
  const raw = getCookie(LOGIN_COOKIE);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LoginUser;
    return parsed && parsed.user ? parsed : null;
  } catch {
    return null;
  }
}

/** 保存登录用户信息到 cookie */
export function saveLoginUser(username: string): void {
  const payload: LoginUser = { user: username, ts: Date.now() };
  setCookie(LOGIN_COOKIE, JSON.stringify(payload), LOGIN_COOKIE_MAX_AGE_DAYS);
}

/** 清除登录用户信息（退出登录） */
export function clearLoginUser(): void {
  removeCookie(LOGIN_COOKIE);
}

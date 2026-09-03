/**
 * 生成 UUID v4。
 * crypto.randomUUID 仅在安全上下文（HTTPS / localhost）可用，
 * 线上以 http://IP 明文访问时该 API 不存在，这里做兼容兜底。
 */
export function generateId(): string {
  // 现代浏览器 + 安全上下文：直接用原生实现
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // http 明文环境兜底一：getRandomValues 在非安全上下文依然可用
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    // RFC 4122 v4：128 位随机数，固定版本位与变体位
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  // 兜底二：极老旧浏览器降级 Math.random
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

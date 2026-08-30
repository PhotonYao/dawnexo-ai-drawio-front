import { extractDrawioXml } from "./drawio";

/** 智能体回复的解析结果（文案由 UI 层按语言生成） */
export type AgentReply =
  | { kind: "user"; text: string }
  | { kind: "drawio"; xml: string };

/**
 * 从 Markdown 围栏代码块中提取最终结果 JSON（{"type":...,"content":...}）。
 * 智能体可能输出整段 Markdown（分析说明、mermaid、审查结论等），
 * 最终结果 JSON 通常位于末尾的 ```json 块中，从后往前找第一个可解析的块。
 */
function extractJsonReply(
  raw: string
): { type: string; content: string } | null {
  const blocks = [...raw.matchAll(/```[^\n]*\n?([\s\S]*?)```/g)];
  for (let i = blocks.length - 1; i >= 0; i--) {
    const candidate = blocks[i][1].trim();
    if (!candidate.startsWith("{")) continue;
    const obj = lenientJsonParse(candidate);
    if (obj && typeof obj.content === "string") {
      return { type: obj.type || "", content: obj.content };
    }
  }
  return null;
}

/**
 * JSON.parse 的容错版本。
 * LLM 输出的结果 JSON 中，字符串内部可能带未转义的真实换行/制表符等控制字符
 * （如 content 中的多行 XML），标准 JSON.parse 会报
 * "Bad control character in string literal"，此处将字符串内部的
 * 控制字符转义后重试。
 */
function lenientJsonParse(text: string): { type?: string; content?: string } | null {
  try {
    return JSON.parse(text) as { type?: string; content?: string };
  } catch {
    // 继续容错处理
  }
  let out = "";
  let inString = false;
  let escaped = false;
  for (const ch of text) {
    if (escaped) {
      out += ch;
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      out += ch;
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      out += ch;
      continue;
    }
    const code = ch.charCodeAt(0);
    if (inString && code < 0x20) {
      if (ch === "\n") out += "\\n";
      else if (ch === "\r") out += "\\r";
      else if (ch === "\t") out += "\\t";
      else out += `\\u${code.toString(16).padStart(4, "0")}`;
      continue;
    }
    out += ch;
  }
  try {
    return JSON.parse(out) as { type?: string; content?: string };
  } catch {
    return null;
  }
}

/**
 * 解析智能体回复（对应后端 ChatResponseDTO 的 {type, content}）：
 * - type = "drawio"：content 为 draw.io XML，需渲染到画布
 * - type = "user"：content 为对话文本，提示用户补充信息
 * 兼容处理：
 * - 正文为整段 Markdown 时，优先取末尾围栏代码块中的结果 JSON
 * - content 为整体 JSON 字符串时直接解包（同样容错真实控制字符）
 * - 均不符合时按内容推断（含 XML 走 drawio，否则当作对话文本）
 */
export function parseAgentReply(
  type: string | undefined,
  content: string
): AgentReply {
  const raw = content ?? "";
  let replyType = type || "";
  let replyContent = raw;

  // 1. 优先取围栏代码块中的结果 JSON
  const jsonReply = extractJsonReply(raw);
  if (jsonReply) {
    replyType = jsonReply.type;
    replyContent = jsonReply.content;
  } else {
    // 2. content 整体就是 JSON 结构时直接解包
    const trimmed = raw.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const obj = lenientJsonParse(trimmed);
      if (obj && typeof obj.content === "string") {
        replyType = obj.type || replyType;
        replyContent = obj.content;
      }
    }
  }

  if (replyType === "drawio") {
    return {
      kind: "drawio",
      xml: extractDrawioXml(replyContent) ?? replyContent,
    };
  }
  if (replyType === "user") {
    return { kind: "user", text: replyContent };
  }

  // 3. 类型未知时按内容推断
  const xml = extractDrawioXml(replyContent);
  if (xml) {
    return { kind: "drawio", xml };
  }
  return { kind: "user", text: replyContent };
}

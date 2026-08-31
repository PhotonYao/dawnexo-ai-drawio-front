import { extractDrawioXml } from "./drawio";

/** 智能体回复的解析结果（文案由 UI 层按语言生成） */
export type AgentReply = {
  kind: "user" | "drawio" | "mixed";
  /** 说明/追问文本，drawio 类型时为空 */
  text: string;
  /** draw.io 图表 XML，user 类型时为空 */
  xml: string;
};

/**
 * 解析智能体回复（对应后端 ChatResponseDTO 的 {type, explanation, diagram}）。
 * 后端已把说明文字与图表数据分离到独立字段，并对非 JSON 输出做了降级兜底，
 * 这里只需按字段存在性归类，无需再处理 content 中的混合内容。
 */
export function parseAgentReply(
  explanation?: string,
  diagram?: string
): AgentReply {
  const text = (explanation ?? "").trim();
  // 容错：diagram 内若残留 Markdown 围栏等包裹，提取出纯 XML
  const xml = diagram ? (extractDrawioXml(diagram) ?? diagram) : "";

  if (xml && text) return { kind: "mixed", text, xml };
  if (xml) return { kind: "drawio", text: "", xml };
  return { kind: "user", text, xml: "" };
}

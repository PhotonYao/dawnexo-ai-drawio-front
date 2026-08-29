/**
 * 从智能体回复中提取 draw.io XML。
 * 回复可能是整段 Markdown（含多个代码块），这里做兜底兼容：
 * - 去掉 Markdown 代码块包裹（```xml ... ```）
 * - 匹配所有 <mxGraphModel>/<mxfile> 片段，过滤含转义引号等无效内容的块
 *   （如 JSON 字符串中未反转义的副本），取最后一个有效块（审查后的最终结果）
 */
export function extractDrawioXml(content: string): string | null {
  if (!content) return null;
  const text = content
    .replace(/```(?:xml)?\s*([\s\S]*?)```/gi, "$1")
    .trim();
  const matches = [...text.matchAll(/<(mxGraphModel|mxfile)\b[\s\S]*?<\/\1>/gi)];
  if (matches.length === 0) {
    return text.startsWith("<") ? text : null;
  }
  // 过滤被 JSON 转义污染的副本（含 \" 或 \n 等字面转义）
  const valid = matches
    .map((m) => m[0])
    .filter((xml) => !/\\["n]/.test(xml));
  const source = valid.length > 0 ? valid : matches.map((m) => m[0]);
  return source[source.length - 1];
}

/** 判断画布 XML 中是否存在实际内容（除 id=0/1 根节点外的 mxCell） */
export function hasDiagramContent(xml: string | null | undefined): boolean {
  if (!xml) return false;
  return /<mxCell\b(?![^>]*\bid="(?:0|1)")/i.test(xml);
}

/** 将 XML 下载为 .drawio 文件 */
export function downloadDrawioXml(
  xml: string,
  filename = "diagram.drawio"
): void {
  const blob = new Blob([xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

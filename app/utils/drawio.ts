/**
 * 从智能体回复中提取 draw.io XML。
 * 智能体按约定直接输出 XML，这里做兜底兼容：
 * - 去掉 Markdown 代码块包裹（```xml ... ```）
 * - 优先截取 <mxGraphModel>/<mxfile> 完整片段
 */
export function extractDrawioXml(content: string): string | null {
  if (!content) return null;
  const text = content
    .replace(/```(?:xml)?\s*([\s\S]*?)```/gi, "$1")
    .trim();
  const match = text.match(/<(mxGraphModel|mxfile)[\s\S]*<\/\1>/i);
  const xml = match ? match[0] : text;
  return xml.startsWith("<") ? xml : null;
}

/** 判断画布 XML 中是否存在实际内容（除 id=0/1 根节点外的 mxCell） */
export function hasDiagramContent(xml: string | null | undefined): boolean {
  if (!xml) return false;
  return /<mxCell\b(?![^>]*\bid="(?:0|1)")/i.test(xml);
}

/** 将 XML 下载为 .drawio 文件 */
export function downloadDrawioXml(xml: string, filename = "diagram.drawio"): void {
  const blob = new Blob([xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

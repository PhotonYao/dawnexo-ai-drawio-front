"use client";

import { useEffect, useRef, useState } from "react";
import { DrawIoEmbed } from "react-drawio";
import { SAMPLE_XML } from "../config/diagram-xml";
import { useAuth } from "./AuthGate";

/** 外部下发的图表载荷：seq 递增表示一次新的加载（包括清空） */
export interface DiagramPayload {
  xml: string;
  seq: number;
}

interface DrawIoEditorProps {
  /** 外部下发的图表（如 AI 对话生成的结果 / 清空指令），seq 变化时加载到编辑器 */
  diagramXml?: DiagramPayload | null;
  /** 画布当前 XML 变化回调（autosave / save 时上报） */
  onXmlChange?: (xml: string) => void;
  /** 挂载时取初始图表内容（语言切换重载画布时用于恢复当前图表） */
  getInitialXml?: () => string | null | undefined;
}

export default function DrawIoEditor({
  diagramXml,
  onXmlChange,
  getInitialXml,
}: DrawIoEditorProps) {
  const { locale } = useAuth();
  // 传给编辑器的图表内容（仅在挂载 / 加载外部 XML 时更新，
  // 不回写 autosave 内容，避免 xml prop 变化导致 iframe 反复重载）
  const [xml, setXml] = useState<string>(
    () => getInitialXml?.() ?? SAMPLE_XML
  );
  // 最近一次已加载的载荷序号，避免重复加载
  const appliedSeqRef = useRef<number>(0);

  // 外部下发的图表 XML（AI 生成 / 清空画布）到达时，加载到编辑器
  useEffect(() => {
    if (diagramXml && diagramXml.seq !== appliedSeqRef.current) {
      appliedSeqRef.current = diagramXml.seq;
      setXml(diagramXml.xml);
    }
  }, [diagramXml]);

  return (
    <div className="h-full w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      <DrawIoEmbed
        autosave
        xml={xml}
        urlParameters={{
          ui: "kennedy",
          spin: true,
          libraries: true,
          saveAndExit: true,
          // draw.io 编辑器界面语言（iframe src 变化时自动重载切换）
          lang: locale,
        }}
        onAutoSave={(data) => onXmlChange?.(data.xml)}
        onSave={(data) => onXmlChange?.(data.xml)}
      />
    </div>
  );
}

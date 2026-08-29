"use client";

import { useCallback, useRef, useState } from "react";
import DrawIoEditor, { type DiagramPayload } from "./components/DrawIoEditor";
import ChatPanel from "./components/ChatPanel";
import AuthGate, { useAuth } from "./components/AuthGate";
import { EMPTY_XML, SAMPLE_XML } from "./config/diagram-xml";

/** 主界面：需要登录后展示，登录用户变化时重置对话状态 */
function AppShell() {
  const { user } = useAuth();
  // 下发给画布的图表载荷（AI 生成 / 清空），seq 递保证重复内容也能触发加载
  const [diagram, setDiagram] = useState<DiagramPayload | null>(null);
  const diagramSeqRef = useRef(0);
  // 画布当前 XML（autosave 上报），用于新建对话前判断内容 / 保存；初始与画布默认示例一致
  const canvasXmlRef = useRef<string>(SAMPLE_XML);

  // 下发图表 XML 到画布（AI 生成 / 示例渲染 / 清空）。
  // 程序化 load 不会触发 autosave，因此命令下发时同步更新 canvasXmlRef，保证内容判断始终最新
  const handleDiagramXml = useCallback((xml: string) => {
    canvasXmlRef.current = xml;
    diagramSeqRef.current += 1;
    setDiagram({ xml, seq: diagramSeqRef.current });
  }, []);

  // 清空画布（新建对话）
  const handleClearCanvas = useCallback(() => {
    canvasXmlRef.current = EMPTY_XML;
    handleDiagramXml(EMPTY_XML);
  }, [handleDiagramXml]);

  // 画布当前 XML 上报
  const handleXmlChange = useCallback((xml: string) => {
    canvasXmlRef.current = xml;
  }, []);

  const getCanvasXml = useCallback(() => canvasXmlRef.current, []);

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-0 flex-1 flex-row gap-3 p-3">
        <div className="min-w-0 flex-1">
          <DrawIoEditor diagramXml={diagram} onXmlChange={handleXmlChange} />
        </div>
        <ChatPanel
          key={user?.user ?? "guest"}
          onDiagramXml={handleDiagramXml}
          getCanvasXml={getCanvasXml}
          onClearCanvas={handleClearCanvas}
        />
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <AuthGate>
      <AppShell />
    </AuthGate>
  );
}

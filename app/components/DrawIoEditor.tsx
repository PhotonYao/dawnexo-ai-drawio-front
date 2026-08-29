"use client";

import { useRef, useState } from "react";
import { DrawIoEmbed, type DrawIoEmbedRef } from "react-drawio";

// A minimal, valid draw.io diagram used as the initial content / "load sample" payload.
const SAMPLE_XML = `<mxGraphModel dx="800" dy="600" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0">
  <root>
    <mxCell id="0" />
    <mxCell id="1" parent="0" />
    <mxCell id="2" value="Hello draw.io" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
      <mxGeometry x="120" y="120" width="160" height="60" as="geometry" />
    </mxCell>
  </root>
</mxGraphModel>`;

export default function DrawIoEditor() {
  const drawioRef = useRef<DrawIoEmbedRef>(null);

  // Latest diagram XML captured via autosave / save events.
  const [xml, setXml] = useState<string>(SAMPLE_XML);
  // Exported image (xmlsvg string) rendered below the editor.
  const [exportedSvg, setExportedSvg] = useState<string | null>(null);

  const handleExport = () => {
    drawioRef.current?.exportDiagram({ format: "xmlsvg" });
  };

  const handleLoadSample = () => {
    drawioRef.current?.load({ xml: SAMPLE_XML, autosave: true });
  };

  const handleDownloadXml = () => {
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diagram.drawio";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleExport}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          导出 SVG
        </button>
        <button
          type="button"
          onClick={handleLoadSample}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          加载示例
        </button>
        <button
          type="button"
          onClick={handleDownloadXml}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          下载 XML
        </button>
        <span className="ml-auto text-xs text-zinc-500 dark:text-zinc-400">
          自动保存已开启
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <DrawIoEmbed
          ref={drawioRef}
          autosave
          xml={xml}
          urlParameters={{
            ui: "kennedy",
            spin: true,
            libraries: true,
            saveAndExit: true,
          }}
          onAutoSave={(data) => setXml(data.xml)}
          onSave={(data) => setXml(data.xml)}
          onExport={(data) => setExportedSvg(data.data)}
        />
      </div>

      {exportedSvg && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            导出预览
          </h2>
          <div className="overflow-auto rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <iframe
              title="导出的图表"
              srcDoc={exportedSvg}
              className="h-64 w-full border-0"
            />
          </div>
        </div>
      )}
    </div>
  );
}

import type { TFunc } from "./i18n";

/** 快速示例：预置的示例对话，点击后本地渲染（不请求消息接口），文案来自 i18n */
export interface QuickExample {
  id: string;
  /** 示例对应的 draw.io XML，渲染到左侧画布 */
  xml: string;
}

const FLOW_XML = `<mxGraphModel dx="800" dy="600" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0">
  <root>
    <mxCell id="0" />
    <mxCell id="1" parent="0" />
    <mxCell id="2" value="需求分析" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
      <mxGeometry x="40" y="60" width="120" height="48" as="geometry" />
    </mxCell>
    <mxCell id="3" value="系统设计" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
      <mxGeometry x="220" y="60" width="120" height="48" as="geometry" />
    </mxCell>
    <mxCell id="4" value="编码实现" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;" vertex="1" parent="1">
      <mxGeometry x="400" y="60" width="120" height="48" as="geometry" />
    </mxCell>
    <mxCell id="5" value="测试验收" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;" vertex="1" parent="1">
      <mxGeometry x="400" y="180" width="120" height="48" as="geometry" />
    </mxCell>
    <mxCell id="6" value="上线发布" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;" vertex="1" parent="1">
      <mxGeometry x="220" y="180" width="120" height="48" as="geometry" />
    </mxCell>
    <mxCell id="7" style="edgeStyle=orthogonalEdgeStyle;html=1;" edge="1" parent="1" source="2" target="3">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="8" style="edgeStyle=orthogonalEdgeStyle;html=1;" edge="1" parent="1" source="3" target="4">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="9" style="edgeStyle=orthogonalEdgeStyle;html=1;" edge="1" parent="1" source="4" target="5">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="10" style="edgeStyle=orthogonalEdgeStyle;html=1;" edge="1" parent="1" source="5" target="6">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
  </root>
</mxGraphModel>`;

const ORG_XML = `<mxGraphModel dx="800" dy="600" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0">
  <root>
    <mxCell id="0" />
    <mxCell id="1" parent="0" />
    <mxCell id="2" value="CEO" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
      <mxGeometry x="280" y="40" width="140" height="48" as="geometry" />
    </mxCell>
    <mxCell id="3" value="技术部" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
      <mxGeometry x="80" y="160" width="120" height="48" as="geometry" />
    </mxCell>
    <mxCell id="4" value="产品部" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;" vertex="1" parent="1">
      <mxGeometry x="290" y="160" width="120" height="48" as="geometry" />
    </mxCell>
    <mxCell id="5" value="运营部" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;" vertex="1" parent="1">
      <mxGeometry x="500" y="160" width="120" height="48" as="geometry" />
    </mxCell>
    <mxCell id="6" value="前端组" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
      <mxGeometry x="30" y="280" width="100" height="40" as="geometry" />
    </mxCell>
    <mxCell id="7" value="后端组" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
      <mxGeometry x="150" y="280" width="100" height="40" as="geometry" />
    </mxCell>
    <mxCell id="8" style="edgeStyle=orthogonalEdgeStyle;html=1;" edge="1" parent="1" source="2" target="3">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="9" style="edgeStyle=orthogonalEdgeStyle;html=1;" edge="1" parent="1" source="2" target="4">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="10" style="edgeStyle=orthogonalEdgeStyle;html=1;" edge="1" parent="1" source="2" target="5">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="11" style="edgeStyle=orthogonalEdgeStyle;html=1;" edge="1" parent="1" source="3" target="6">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="12" style="edgeStyle=orthogonalEdgeStyle;html=1;" edge="1" parent="1" source="3" target="7">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
  </root>
</mxGraphModel>`;

const DEPLOY_XML = `<mxGraphModel dx="800" dy="600" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0">
  <root>
    <mxCell id="0" />
    <mxCell id="1" parent="0" />
    <mxCell id="2" value="用户" style="shape=mxgraph.cisco.people.standing_man;html=1;verticalLabelPosition=bottom;verticalAlign=top;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
      <mxGeometry x="60" y="120" width="60" height="60" as="geometry" />
    </mxCell>
    <mxCell id="3" value="负载均衡&#10;Nginx" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
      <mxGeometry x="220" y="110" width="120" height="70" as="geometry" />
    </mxCell>
    <mxCell id="4" value="应用服务 A" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;" vertex="1" parent="1">
      <mxGeometry x="420" y="40" width="130" height="56" as="geometry" />
    </mxCell>
    <mxCell id="5" value="应用服务 B" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;" vertex="1" parent="1">
      <mxGeometry x="420" y="190" width="130" height="56" as="geometry" />
    </mxCell>
    <mxCell id="6" value="MySQL&#10;主从集群" style="shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=12;fillColor=#f8cecc;strokeColor=#b85450;" vertex="1" parent="1">
      <mxGeometry x="640" y="40" width="90" height="76" as="geometry" />
    </mxCell>
    <mxCell id="7" value="Redis&#10;缓存" style="shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=12;fillColor=#fff2cc;strokeColor=#d6b656;" vertex="1" parent="1">
      <mxGeometry x="640" y="190" width="90" height="76" as="geometry" />
    </mxCell>
    <mxCell id="8" style="edgeStyle=orthogonalEdgeStyle;html=1;" edge="1" parent="1" source="2" target="3">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="9" style="edgeStyle=orthogonalEdgeStyle;html=1;" edge="1" parent="1" source="3" target="4">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="10" style="edgeStyle=orthogonalEdgeStyle;html=1;" edge="1" parent="1" source="3" target="5">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="11" style="edgeStyle=orthogonalEdgeStyle;html=1;" edge="1" parent="1" source="4" target="6">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="12" style="edgeStyle=orthogonalEdgeStyle;html=1;" edge="1" parent="1" source="5" target="7">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
  </root>
</mxGraphModel>`;

export const QUICK_EXAMPLES: QuickExample[] = [
  { id: "dev-flow", xml: FLOW_XML },
  { id: "org-chart", xml: ORG_XML },
  { id: "deploy-arch", xml: DEPLOY_XML },
];

/** 读取示例的多语言字段（title / description / prompt / reply） */
export function exampleText(
  t: TFunc,
  id: string,
  field: "title" | "description" | "prompt" | "reply"
): string {
  return t(`example.${id}.${field}`);
}

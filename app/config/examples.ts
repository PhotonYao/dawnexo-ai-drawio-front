/** 快速示例：预置的示例对话，点击后本地渲染（不请求后端） */
export interface QuickExample {
  id: string;
  title: string;
  description: string;
  /** 点击示例后以用户身份展示的提问 */
  prompt: string;
  /** 系统示例的回复说明 */
  reply: string;
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

const DEPLOY_XML = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="embed.diagrams.net">
  <diagram name="第 1 页" id="oak1YgR1F0PGWmvcKpvl">
    <mxGraphModel dx="1008" dy="1155" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1200" pageHeight="900" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <mxCell id="2" parent="1" style="shape=image;verticalLabelPosition=bottom;labelBackgroundColor=#ffffff;verticalAlign=top;aspect=fixed;imageAspect=0;image=data:image/svg+xml,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjMjE3MzQ2Ij48cGF0aCBkPSJNMTIgMTJjMi43NiAwIDUtMi4yNCA1LTVzLTIuMjQtNS01LTUtNSAyLjI0LTUgNSAyLjI0IDUgNSA1em0wIDJjLTMuMzMgMC0xMCAxLjY3LTEwIDV2MmgxOHYtMmMwLTMuMzMtNi42Ny01LTEwLTV6Ii8+PC9zdmc+;fontSize=14;fontColor=#1a1a1a;strokeColor=none;fillColor=none;rounded=1;" value="🌐 外网用户" vertex="1">
          <mxGeometry height="80" width="80" x="520" y="40" as="geometry" />
        </mxCell>
        <mxCell id="3" edge="1" parent="1" source="2" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;entryX=0.5;entryY=0;entryDx=0;entryDy=0;strokeWidth=2;strokeColor=#4a4a4a;endArrow=classic;" target="4">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="4" parent="1" style="rounded=1;whiteSpace=wrap;html=1;fontSize=14;fillColor=#fff2cc;strokeColor=#d6b656;strokeWidth=2;shadow=1;fontColor=#333;align=center;verticalAlign=middle;" value="🛡️ 防火墙（WAN）" vertex="1">
          <mxGeometry height="50" width="140" x="490" y="180" as="geometry" />
        </mxCell>
        <mxCell id="5" edge="1" parent="1" source="4" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;entryX=0.5;entryY=0;entryDx=0;entryDy=0;strokeWidth=2;strokeColor=#4a4a4a;endArrow=classic;" target="6">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="6" parent="1" style="rounded=1;whiteSpace=wrap;html=1;fontSize=14;fillColor=#d5e8d4;strokeColor=#82b366;strokeWidth=2;shadow=1;fontColor=#333;align=center;verticalAlign=middle;" value="⚖️ 负载均衡器&#xa;（Nginx / HAProxy）" vertex="1">
          <mxGeometry height="60" width="180" x="470" y="300" as="geometry" />
        </mxCell>
        <mxCell id="7" edge="1" parent="1" source="6" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;entryX=0.5;entryY=0;entryDx=0;entryDy=0;strokeWidth=2;strokeColor=#4a4a4a;endArrow=classic;" target="9">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="560" y="400" />
              <mxPoint x="320" y="400" />
            </Array>
          </mxGeometry>
        </mxCell>
        <mxCell id="8" edge="1" parent="1" source="6" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;entryX=0.5;entryY=0;entryDx=0;entryDy=0;strokeWidth=2;strokeColor=#4a4a4a;endArrow=classic;" target="10">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="560" y="400" />
              <mxPoint x="800" y="400" />
            </Array>
          </mxGeometry>
        </mxCell>
        <mxCell id="9" parent="1" style="rounded=1;whiteSpace=wrap;html=1;fontSize=14;fillColor=#e1d5e7;strokeColor=#9673a6;strokeWidth=2;shadow=1;fontColor=#333;align=center;verticalAlign=middle;" value="🖥️ 应用服务器 1&#xa;（Spring Boot）" vertex="1">
          <mxGeometry height="60" width="180" x="230" y="420" as="geometry" />
        </mxCell>
        <mxCell id="10" parent="1" style="rounded=1;whiteSpace=wrap;html=1;fontSize=14;fillColor=#e1d5e7;strokeColor=#9673a6;strokeWidth=2;shadow=1;fontColor=#333;align=center;verticalAlign=middle;" value="🖥️ 应用服务器 2&#xa;（Spring Boot）" vertex="1">
          <mxGeometry height="60" width="180" x="710" y="420" as="geometry" />
        </mxCell>
        <mxCell id="11" edge="1" parent="1" source="9" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;entryX=0.5;entryY=0;entryDx=0;entryDy=0;strokeWidth=2;strokeColor=#4a4a4a;endArrow=classic;" target="13">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="320" y="510.08" />
              <mxPoint x="560" y="510.08" />
            </Array>
          </mxGeometry>
        </mxCell>
        <mxCell id="12" edge="1" parent="1" source="10" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;entryX=0.5;entryY=0;entryDx=0;entryDy=0;strokeWidth=2;strokeColor=#4a4a4a;endArrow=classic;" target="13">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="800" y="510.08" />
              <mxPoint x="560" y="510.08" />
            </Array>
          </mxGeometry>
        </mxCell>
        <mxCell id="13" parent="1" style="shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fontSize=14;fillColor=#f8cecc;strokeColor=#b85450;strokeWidth=2;shadow=1;fontColor=#333;align=center;verticalAlign=top;" value="🗄️ 数据库主库&#xa;（PostgreSQL）" vertex="1">
          <mxGeometry height="80" width="200" x="460" y="550" as="geometry" />
        </mxCell>
        <mxCell id="14" edge="1" parent="1" source="9" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;entryX=0.5;entryY=0;entryDx=0;entryDy=0;strokeWidth=2;strokeColor=#4a4a4a;endArrow=classic;dashed=1;entryPerimeter=0;" target="16">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="180" y="450.08" />
              <mxPoint x="180" y="380.08" />
              <mxPoint x="1040" y="380.08" />
            </Array>
          </mxGeometry>
        </mxCell>
        <mxCell id="15" edge="1" parent="1" source="10" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;entryX=0.5;entryY=0;entryDx=0;entryDy=0;strokeWidth=2;strokeColor=#4a4a4a;endArrow=classic;dashed=1;" target="16">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="1040" y="450.08" />
            </Array>
          </mxGeometry>
        </mxCell>
        <mxCell id="16" parent="1" style="shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fontSize=14;fillColor=#ffe6cc;strokeColor=#d79b00;strokeWidth=2;shadow=1;fontColor=#333;align=center;verticalAlign=top;" value="⚡ Redis 缓存" vertex="1">
          <mxGeometry height="70" width="160" x="960" y="550" as="geometry" />
        </mxCell>
        <mxCell id="17" parent="1" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;fontSize=16;fontColor=#666;fontStyle=2;labelBackgroundColor=#f5f5f5;" value="DMZ / 内网区域" vertex="1">
          <mxGeometry height="30" width="760" x="180" y="140" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

export const QUICK_EXAMPLES: QuickExample[] = [
  {
    id: "dev-flow",
    title: "软件开发流程图",
    description: "需求 → 设计 → 编码 → 测试 → 上线的完整流程",
    prompt:
      "帮我画一个软件开发流程图，包含需求分析、系统设计、编码实现、测试验收、上线发布。",
    reply:
      "好的，已为你生成软件开发流程图：从需求分析开始，依次经过系统设计、编码实现、测试验收，最终上线发布。节点按流程顺序用正交连线连接，你可以直接在左侧画布中调整样式。",
    xml: FLOW_XML,
  },
  {
    id: "org-chart",
    title: "公司组织架构图",
    description: "CEO 与技术、产品、运营部门的层级关系",
    prompt:
      "帮我画一个公司组织架构图，CEO 下设技术部、产品部、运营部，技术部再分前端组和后端组。",
    reply:
      "好的，已为你生成公司组织架构图：CEO 位于顶层，向下分管技术部、产品部和运营部，技术部进一步划分为前端组和后端组。层级关系清晰，可在左侧画布中继续扩展部门。",
    xml: ORG_XML,
  },
  {
    id: "deploy-arch",
    title: "应用部署架构图",
    description: "负载均衡、双应用服务与数据库/缓存拓扑",
    prompt:
      "帮我画一个应用部署架构图：用户经 Nginx 负载均衡访问两台应用服务，应用服务分别连接 MySQL 数据库和 Redis 缓存。",
    reply:
      "好的，已为你生成应用部署架构图：用户请求经 Nginx 负载均衡分发到应用服务 A / B，两台应用分别对接 MySQL 主从集群与 Redis 缓存。可在左侧画布中调整拓扑或补充节点。",
    xml: DEPLOY_XML,
  },
];

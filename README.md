# Dawnexo AI Draw 前端 · 智能图表生成器

基于 AI 对话的 draw.io 图表生成器前端，与配套后端 [dawnexo-ai-drawio-backend](https://github.com/PhotonYao/dawnexo-ai-drawio-backend) 一起构成完整应用：用自然语言描述图表，智能体生成 draw.io XML 并自动渲染到左侧画布。

## 功能特性

- **登录拦截**：进入页面校验 cookie 登录态（`ai_agent_login`），未登录弹出登录弹窗，登录信息保留 7 天（演示账号 `admin / admin`）
- **快速示例**：预置 3 个图表示例，点击后在本地生成对话并渲染画布（同时创建会话，不调用消息接口）
- **智能体对话**：对接后端 `query_ai_agent_config_list` / `create_session` / `chat` 接口；智能体回复按 `{type, content}` 结构解析（`user` 追问补充信息、`drawio` 图表 XML），并兼容 Markdown 包裹、末尾 JSON 块、转义异常等真实输出
- **图表渲染**：draw.io XML 自动渲染到左侧 `DrawIoEmbed` 画布，消息气泡中以可折叠代码块同步展示 XML（超长自动折叠、支持复制）
- **最近对话**：本地保存最近 20 条对话（localStorage 按用户隔离），点击可恢复消息、会话与画布；支持重命名标题、删除记录；新建对话时若画布有内容会提示保存
- **中英双语**：设置弹窗中切换界面语言（中文 / English），界面文案、浏览器标签标题、draw.io 编辑器界面语言一并切换，偏好持久化
- **可拖拽侧边栏**：对话侧边栏宽度可拖拽调节（200px ~ 窗口 50%，拖到最小自动收起）
- **会话隔离**：以服务端回传的 `sessionId` 为准，配合后端会话归属校验，防止会话上下文交叉污染

## 技术栈

- Next.js 16（App Router）/ React 19 / TypeScript
- Tailwind CSS v4
- [react-drawio](https://www.npmjs.com/package/react-drawio)（draw.io 嵌入编辑器）

## 目录结构

```
app/
├── api/            # 服务端接口对接（agent.ts：统一请求封装、三个接口）
├── config/         # 配置与常量
│   ├── api-config.ts   # 后端 API 地址、登录 cookie 配置
│   ├── i18n.ts         # 中英文案字典、标签页标题
│   ├── examples.ts     # 快速示例（预置 draw.io XML）
│   └── diagram-xml.ts  # 初始/空画布 XML
├── types/          # 接口类型定义（api.ts）
├── utils/          # 工具（cookie、draw.io XML 提取、回复解析、最近对话存储）
└── components/     # 组件（ChatPanel / DrawIoEditor / AuthGate / LoginDialog / SettingsDialog / NewChatDialog / CodeBlock）
```

## 快速开始

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)，使用演示账号 `admin / admin` 登录。

## 配置

- 后端服务地址、接口前缀、登录 cookie 名统一在 [app/config/api-config.ts](app/config/api-config.ts) 中管理（默认 `http://127.0.0.1:8090`，需先启动后端服务）；
- 绘图智能体由后端 `agent-draw-io.yml` 配置驱动。

## 可用脚本

```bash
npm run dev     # 开发模式（Turbopack 热更新）
npm run build   # 生产构建
npm run start   # 运行生产构建
npm run lint    # ESLint 检查
```

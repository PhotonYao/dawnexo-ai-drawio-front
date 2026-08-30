/** 界面多语言配置：中文 / 英文 */

export type Locale = "zh" | "en";

// 语言偏好本地存储键
export const LOCALE_STORAGE_KEY = "ai_drawio_locale";

// 浏览器标签页标题（按语言）
export const PAGE_TITLES: Record<Locale, string> = {
  zh: "Dawnexo AI 绘图 · 智能图表生成器",
  en: "Dawnexo AI Draw · Smart Diagram Generator",
};

// 语言下拉选项显示名（使用语言原生名称）
export const LOCALE_LABELS: Record<Locale, string> = {
  zh: "中文",
  en: "English",
};

type Dict = Record<string, string>;

const zh: Dict = {
  "app.title": "AI Draw.io 编辑器",

  // 登录
  "login.title": "登录 Dawnexo AI 绘图",
  "login.subtitle": "请登录以继续使用智能体服务",
  "login.username": "账号",
  "login.password": "密码",
  "login.usernamePlaceholder": "请输入账号",
  "login.passwordPlaceholder": "请输入密码",
  "login.submit": "登 录",
  "login.submitting": "登录中…",
  "login.errorRequired": "请输入账号和密码",
  "login.errorInvalid": "账号或密码错误（演示账号 admin/admin）",
  "login.demoHint": "演示账号 / 密码：",

  // 设置
  "settings.title": "设置",
  "settings.account": "登录信息",
  "settings.loginAt": "登录于",
  "settings.logout": "退出登录",
  "settings.language": "语言",
  "settings.languageSubtitle": "选择界面语言",

  // 对话
  "chat.tab": "对话",
  "chat.expand": "展开对话",
  "chat.collapse": "收起",
  "chat.resizeTitle": "拖动调节宽度",
  "chat.selectAgent": "选择智能体",
  "chat.agentsLoading": "智能体加载中…",
  "chat.agentsFailed": "智能体加载失败",
  "chat.new": "＋ 新建",
  "chat.newTitle": "新建对话",
  "chat.placeholder": "描述你想要的图表，Enter 发送…",
  "chat.send": "发送",
  "chat.stop": "停止生成",
  "chat.generating": "正在生成图表…",
  "chat.welcome":
    "你好，我是 AI 绘图助手。描述你想要的图表，我来帮你生成并渲染到左侧画布。",
  "chat.noAgent": "智能体列表加载中，请稍后重试。",
  "chat.agentError": "【接口异常】",
  "chat.requestError": "【请求异常】",
  "chat.unknownError": "未知错误",
  "chat.emptyReply": "（智能体未返回内容）",
  "chat.diagramReady":
    "已根据你的描述生成图表，并渲染到左侧画布，可直接编辑或导出。",
  "chat.defaultTitle": "新对话",

  // 消息操作
  "chat.editMessage": "编辑消息",
  "chat.copy": "复制消息",
  "chat.copied": "已复制",
  "chat.regenerate": "重新生成响应",
  "chat.saveAndSubmit": "保存并提交",

  // 快速示例
  "chat.quickExamples": "快速示例",
  "chat.quickExamplesDesc":
    "点击示例快速开始，图表会自动渲染到左侧画布，也可以直接输入你的需求。",
  "example.dev-flow.title": "软件开发流程图",
  "example.dev-flow.description": "需求 → 设计 → 编码 → 测试 → 上线的完整流程",
  "example.dev-flow.prompt":
    "帮我画一个软件开发流程图，包含需求分析、系统设计、编码实现、测试验收、上线发布。",
  "example.dev-flow.reply":
    "好的，已为你生成软件开发流程图：从需求分析开始，依次经过系统设计、编码实现、测试验收，最终上线发布。节点按流程顺序用正交连线连接，你可以直接在左侧画布中调整样式。",
  "example.org-chart.title": "公司组织架构图",
  "example.org-chart.description": "CEO 与技术、产品、运营部门的层级关系",
  "example.org-chart.prompt":
    "帮我画一个公司组织架构图，CEO 下设技术部、产品部、运营部，技术部再分前端组和后端组。",
  "example.org-chart.reply":
    "好的，已为你生成公司组织架构图：CEO 位于顶层，向下分管技术部、产品部和运营部，技术部进一步划分为前端组和后端组。层级关系清晰，可在左侧画布中继续扩展部门。",
  "example.deploy-arch.title": "应用部署架构图",
  "example.deploy-arch.description": "负载均衡、双应用服务与数据库/缓存拓扑",
  "example.deploy-arch.prompt":
    "帮我画一个应用部署架构图：用户经 Nginx 负载均衡访问两台应用服务，应用服务分别连接 MySQL 数据库和 Redis 缓存。",
  "example.deploy-arch.reply":
    "好的，已为你生成应用部署架构图：用户请求经 Nginx 负载均衡分发到应用服务 A / B，两台应用分别对接 MySQL 主从集群与 Redis 缓存。可在左侧画布中调整拓扑或补充节点。",

  // 最近对话
  "chat.recentChats": "最近对话",
  "chat.recentEmpty": "暂无最近对话，发送消息后将自动保存（最多 20 条）。",
  "chat.unknownAgent": "未知智能体",
  "chat.sessionLabel": "会话",
  "chat.rename": "重命名",
  "chat.renamePlaceholder": "输入新的会话标题",
  "chat.delete": "删除",

  // 通用
  "common.cancel": "取消",
  "common.save": "保存",

  // 新建对话确认弹窗
  "newChat.title": "新建对话",
  "newChat.body":
    "新建对话将清空当前画布内容。是否先保存当前图表（将下载 .drawio 文件）？",
  "newChat.saveAndNew": "保存并新建",
  "newChat.discardAndNew": "直接新建",

  // 代码块
  "code.lines": "代码（{n} 行）",
  "code.expand": "展开",
  "code.collapse": "收起",
  "code.expandAll": "展开全部（{n} 行）",
  "code.copy": "复制代码",
  "code.copied": "已复制",
};

const en: Dict = {
  "app.title": "AI Draw.io Editor",

  // Login
  "login.title": "Sign in to Dawnexo AI Draw",
  "login.subtitle": "Sign in to continue using the AI agent service",
  "login.username": "Username",
  "login.password": "Password",
  "login.usernamePlaceholder": "Enter username",
  "login.passwordPlaceholder": "Enter password",
  "login.submit": "Sign In",
  "login.submitting": "Signing in…",
  "login.errorRequired": "Please enter username and password",
  "login.errorInvalid": "Incorrect username or password (demo: admin/admin)",
  "login.demoHint": "Demo account / password:",

  // Settings
  "settings.title": "Settings",
  "settings.account": "Account",
  "settings.loginAt": "Signed in at",
  "settings.logout": "Sign Out",
  "settings.language": "Language",
  "settings.languageSubtitle": "Select interface language",

  // Chat
  "chat.tab": "Chat",
  "chat.expand": "Expand Chat",
  "chat.collapse": "Collapse",
  "chat.resizeTitle": "Drag to resize",
  "chat.selectAgent": "Select agent",
  "chat.agentsLoading": "Loading agents…",
  "chat.agentsFailed": "Failed to load agents",
  "chat.new": "+ New",
  "chat.newTitle": "New Chat",
  "chat.placeholder": "Describe the diagram you want, press Enter to send…",
  "chat.send": "Send",
  "chat.stop": "Stop generating",
  "chat.generating": "Generating diagram…",
  "chat.welcome":
    "Hi! I'm your AI diagram assistant. Describe the diagram you want and I'll generate it onto the canvas on the left.",
  "chat.noAgent": "Agent list is loading, please try again shortly.",
  "chat.agentError": "[Agent Error] ",
  "chat.requestError": "[Request Error] ",
  "chat.unknownError": "Unknown error",
  "chat.emptyReply": "(The agent returned no content)",
  "chat.diagramReady":
    "Diagram generated from your description and rendered on the left canvas — edit or export it directly.",
  "chat.defaultTitle": "New Chat",

  // Message actions
  "chat.editMessage": "Edit message",
  "chat.copy": "Copy message",
  "chat.copied": "Copied",
  "chat.regenerate": "Regenerate response",
  "chat.saveAndSubmit": "Save & Send",

  // Quick examples
  "chat.quickExamples": "Quick Examples",
  "chat.quickExamplesDesc":
    "Click an example to start quickly — the diagram renders onto the canvas on the left. You can also type your own request.",
  "example.dev-flow.title": "Software Development Flow",
  "example.dev-flow.description":
    "Requirements → Design → Coding → Testing → Release",
  "example.dev-flow.prompt":
    "Draw a software development flowchart covering requirements analysis, system design, coding, testing & acceptance, and release.",
  "example.dev-flow.reply":
    "Done! I've generated a software development flowchart: starting from requirements analysis, through system design, coding and testing & acceptance, ending at release. Nodes are connected in order with orthogonal edges — adjust the styles directly on the left canvas.",
  "example.org-chart.title": "Company Org Chart",
  "example.org-chart.description":
    "CEO with Technology, Product and Operations departments",
  "example.org-chart.prompt":
    "Draw a company org chart: the CEO oversees Technology, Product and Operations departments, and Technology is split into a Frontend team and a Backend team.",
  "example.org-chart.reply":
    "Done! I've generated a company org chart: the CEO sits at the top, supervising the Technology, Product and Operations departments, with Technology further divided into Frontend and Backend teams. Extend more departments directly on the left canvas.",
  "example.deploy-arch.title": "App Deployment Architecture",
  "example.deploy-arch.description":
    "Load balancer, dual app servers, database & cache topology",
  "example.deploy-arch.prompt":
    "Draw a deployment architecture: users reach two app servers through an Nginx load balancer, and the app servers connect to a MySQL cluster and a Redis cache.",
  "example.deploy-arch.reply":
    "Done! I've generated an application deployment architecture: user requests hit the Nginx load balancer and are distributed to App Server A / B, each connecting to the MySQL primary-replica cluster and the Redis cache. Adjust the topology on the left canvas.",

  // Recent chats
  "chat.recentChats": "Recent Chats",
  "chat.recentEmpty":
    "No recent chats yet. Conversations are saved automatically (up to 20).",
  "chat.unknownAgent": "Unknown agent",
  "chat.sessionLabel": "Session",
  "chat.rename": "Rename",
  "chat.renamePlaceholder": "Enter a new chat title",
  "chat.delete": "Delete",

  // Common
  "common.cancel": "Cancel",
  "common.save": "Save",

  // New chat dialog
  "newChat.title": "New Chat",
  "newChat.body":
    "Starting a new chat will clear the canvas. Save the current diagram first (downloads a .drawio file)?",
  "newChat.saveAndNew": "Save & New",
  "newChat.discardAndNew": "Discard & New",

  // Code block
  "code.lines": "Code ({n} lines)",
  "code.expand": "Expand",
  "code.collapse": "Collapse",
  "code.expandAll": "Expand all ({n} lines)",
  "code.copy": "Copy code",
  "code.copied": "Copied",
};

/** 创建指定语言的翻译函数，{name} 占位符会被 params 替换 */
export function createT(locale: Locale) {
  const table = locale === "en" ? en : zh;
  return (
    key: string,
    params?: Record<string, string | number>
  ): string => {
    let text = table[key] ?? zh[key] ?? key;
    if (params) {
      for (const [name, value] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${name}\\}`, "g"), String(value));
      }
    }
    return text;
  };
}

export type TFunc = ReturnType<typeof createT>;

/** 是否为合法的语言值（读取本地存储时校验用） */
export function isValidLocale(value: string | null): value is Locale {
  return value === "zh" || value === "en";
}

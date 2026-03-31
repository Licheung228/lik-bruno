# Bruno App 展示文本中文化计划

## 1. Summary

目标：将 `packages/bruno-app/src` 中用户可见展示文案改为中文，采用“直接替换为中文”的方式；术语风格采用“中英混排”（如 Request、Collection、Workspace 等保留英文）。

本次不包含：
- `packages/bruno-electron` 原生层文案
- CLI 输出、文档与测试夹具文案
- 新增完整多语言切换能力（不扩展 i18n 架构）

## 2. Current State Analysis

### 2.1 现状结论（基于代码扫描）
- App 当前 i18n 已接入但使用很少：`src/i18n/index.js` + `src/i18n/translation/en.json`，默认语言 `en`。
- `useTranslation/t()` 仅在 `components/Preferences/Support/index.js` 有明显使用，其它绝大多数文案为硬编码英文。
- 用户可见字符串高密度目录集中在：
  - `components/`（主 UI 文案）
  - `components/Sidebar/`
  - `components/Environments/`
  - `components/RequestPane/`
  - `components/OpenAPISyncTab/`
  - `components/WorkspaceHome/WorkspaceEnvironments/`
  - `providers/ReduxStore/slices/`（toast/通知文案）
  - `providers/App/`、`providers/Hotkeys/`（事件提示文案）
  - `utils/collections/`（被 UI 直接展示的名称映射）

### 2.2 已确认决策
- 覆盖范围：仅前端界面（`bruno-app`）。
- 实现方式：直接替换为中文。
- 术语风格：中英混排。

## 3. Proposed Changes

### 3.1 基础策略
- 仅修改 `packages/bruno-app/src` 下“用户可见字符串”。
- 保持变量名、函数名、事件名、协议字段名不变，仅替换展示值。
- 统一术语词表，避免同义词混用（例如：Collection 统一“集合（Collection）”或“Collection”，按场景一致化）。

### 3.2 分模块改造（文件与做法）

#### A. 入口菜单与全局交互
- `components/AppTitleBar/AppMenu/index.js`
  - 将顶栏菜单与菜单项文案改中文（File/Edit/View/Help 等）。
  - 快捷键提示保留原样（如 `Ctrl+Z`）。
- `components/GlobalSearchModal/**`
  - 中文化搜索分类名、提示文案、空状态与占位文案。

#### B. Sidebar 与请求/集合管理
- `components/Sidebar/**`（重点文件含 `NewRequest/index.js`、`Collections/Collection/index.js`、`Collections/Collection/CollectionItem/index.js`、`ImportCollection/index.js`）
  - 中文化右键菜单动作、弹窗标题/描述、表单标签、placeholder、按钮文字。
  - 对 Request / Collection / Folder 等术语按“中英混排”统一。

#### C. Environment 相关页面
- `components/Environments/**`
- `components/WorkspaceHome/WorkspaceEnvironments/**`
  - 中文化 Environment 列表、搜索占位、导入导出、创建编辑、删除确认文案。

#### D. 请求编辑与响应区域
- `components/RequestPane/**`
- `components/RequestTabs/**`
- `components/ResponsePane/**`
  - 中文化编辑区按钮、Tab 标题、空态、错误提示、确认对话框文案。
  - 保留协议与技术术语中必要英文（如 HTTP Method 名称）。

#### E. OpenAPI 同步与通知
- `components/OpenAPISyncTab/**`
- `components/Notifications/index.js`
  - 中文化状态说明、操作按钮、通知中心标题及分页/空状态文案。

#### F. 业务提示与 Toast 文案
- `providers/ReduxStore/slices/collections/actions.js`
- `providers/ReduxStore/slices/notifications.js`
- `providers/App/useIpcEvents.js`
- `providers/Hotkeys/index.js`
  - 中文化成功/失败提示与用户操作反馈消息。

#### G. 仍使用 i18n 的现有文案
- `i18n/translation/en.json`
- `components/Preferences/Support/index.js`
  - 不改 key，仅将 value 改为中文，确保当前 `t()` 渲染结果中文化。
  - 同步替换 Support 页面的硬编码标题。

#### H. UI 可见映射文本
- `utils/collections/index.js`
  - 仅替换会直接展示到 UI 的枚举名称/标签文本。
  - 不改内部逻辑判断所依赖的程序标识符。

### 3.3 术语与翻译约束（执行时强制）
- 保留英文：Request、Collection、Workspace、Environment、API、HTTP、JSON、GraphQL、gRPC、WebSocket。
- 中文化动词与操作：创建、打开、导入、导出、保存、删除、重命名、重试、复制、粘贴、确认、取消。
- 危险操作提示采用明确语气：如“此操作不可撤销”。

## 4. Assumptions & Decisions

- 假设“展示、文本”指用户界面可见文案，不含开发者日志与内部错误堆栈。
- 不新增语言切换 UI，不新增 `zh-CN` 资源结构；按当前诉求以“中文展示优先”落地。
- 对于术语采用“中英混排”，优先保障熟悉 Bruno/接口开发用户的可读性。
- 不修改测试断言文本，若现有测试因文案变更失败，将在执行阶段同步更新与文案强相关的断言。

## 5. Verification Steps

1. 静态回归检查  
   - 在 `packages/bruno-app/src` 扫描典型英文 UI 词（如 `Open Collection`、`Create`、`Delete`、`Cancel`、`Save`、`Preferences`、`Documentation`），确认高频残留项被清理或属于允许英文术语。

2. 构建/测试检查  
   - 执行 app 侧测试：`npm test --workspace @usebruno/app`（或仓库等价 workspace 命令）。  
   - 如测试集中无文案覆盖，至少执行一次 app 构建：`npm run build --workspace @usebruno/app`，确认无语法/编译错误。

3. 交互抽检  
   - 启动 app 前端开发环境，抽检关键路径：  
     - 顶栏菜单  
     - Sidebar 新建/右键菜单  
     - Environment 管理  
     - Request/Response 面板  
     - OpenAPI Sync  
     - 通知与错误提示  
   - 验证术语风格符合“中英混排”约束且无明显英文漏网文案。

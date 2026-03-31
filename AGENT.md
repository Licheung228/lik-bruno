# AGENT 指南（Bruno Monorepo）

本文件面向在此仓库内执行任务的智能体与自动化助手，目标是快速、安全、可复现地完成改动。

## 1. 项目概览

- 仓库是 npm workspaces 单体仓库，核心是 Bruno API 客户端（React + Electron）及相关子包。
- 根目录 `package.json` 定义统一脚本与工作区。
- Node 版本建议使用 22.x（见 `contributing.md`）。

## 2. 目录结构（高频）

- `packages/bruno-app`：前端应用（React，rsbuild，Jest）
- `packages/bruno-electron`：Electron 主进程与桥接层
- `packages/bruno-cli`：CLI 能力
- `packages/bruno-*`：公共能力与协议包（common / requests / query / schema / lang 等）
- `tests/`：Playwright 端到端测试
- `scripts/`：构建与开发脚本

## 3. 开发与运行命令

- 安装依赖：`npm i --legacy-peer-deps`
- 一键初始化：`npm run setup`
- 启动开发（Web + Electron）：`npm run dev`
- 单独启动 Web：`npm run dev:web`
- 单独启动 Electron：`npm run dev:electron`

## 4. 质量门禁（改动后必做）

- 代码风格检查：`npm run lint`
- 按改动范围执行对应 workspace 测试，例如：
  - `npm run test --workspace=packages/bruno-app`
  - `npm run test --workspace=packages/bruno-electron`
  - `npm run test --workspace=packages/bruno-common`
- 涉及跨包或不确定影响面时，执行：`npm test --workspaces --if-present`

## 5. 代码规范（摘要）

以 `CODING_STANDARDS.md` 为准，关键点如下：

- 缩进 2 空格，字符串优先单引号，语句末尾分号
- 尽量保持最小改动，避免无意义格式变更
- React 代码优先提炼自定义 hooks，避免不必要 `useEffect`
- 仅在真正复用价值明显时做抽象，命名简洁清晰
- 功能改动需配套测试或更新测试

## 6. 智能体执行原则

- 先读再改：先读取目标文件上下文与相邻实现，再修改
- 局部优先：优先在当前包内完成闭环，避免无关跨包重构
- 不引入未使用依赖；若确需新增依赖，必须在对应 workspace 声明
- 不输出或提交密钥、令牌、证书等敏感信息
- 修改命令或流程时，同步更新受影响脚本与调用方

## 7. 任务落地建议

- 需求拆分：输入处理、核心逻辑、边界行为、验证用例
- 变更顺序：先测试或复现，再实现，再回归
- 提交前检查：
  - 目标功能可运行
  - lint 通过
  - 相关测试通过
  - 无无关文件变更

## 8. 常见入口文件

- 根脚本：`/package.json`
- 贡献指南：`/contributing.md`
- 规范文档：`/CODING_STANDARDS.md`
- E2E 配置：`/playwright.config.ts`

如遇到规范冲突，优先级如下：

1. 用户明确需求
2. 仓库现有实现与测试约束
3. `CODING_STANDARDS.md`
4. 本文件

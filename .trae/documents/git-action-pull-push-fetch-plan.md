# GitAction 弹窗改造计划（pull / push / fetch）

## Summary

将 `packages/bruno-app/src/components/Sidebar/GitAction/index.js` 从当前“新建文件夹”表单改造为 Git 操作弹窗，支持 `fetch` / `pull` / `push`，并展示关键上下文信息（当前分支、origin 远端、ahead/behind）。  
操作策略按已确认偏好执行：固定 `origin + 当前分支`，操作完成后自动刷新状态并回显结果。

## Current State Analysis

- 入口已存在：集合右键菜单“Git Actions”会打开 `GitAction` 弹窗。  
  - `packages/bruno-app/src/components/Sidebar/Collections/Collection/index.js`
- 目标组件内容与用途不匹配：  
  - `packages/bruno-app/src/components/Sidebar/GitAction/index.js` 当前是“新建文件夹”逻辑（Formik + `newFolder`），并非 Git 操作。
- 已有可复用的 Git 后端能力：  
  - `packages/bruno-electron/src/utils/git.js` 已实现 `fetchChanges`、`pullGitChanges`、`pushGitChanges`、`getCollectionGitData`、`getAheadBehindCount` 等。
- 现有 Git IPC 很薄：  
  - `packages/bruno-electron/src/ipc/git.js` 目前只有 `renderer:clone-git-repository`。
- 前端已有 Git 相关状态能力可复用：  
  - `packages/bruno-app/src/providers/ReduxStore/slices/app.js` 有 `gitOperationProgress`，可用于实时输出显示。

## Proposed Changes

### 1) 修正 GitAction 调用参数

- 文件：`packages/bruno-app/src/components/Sidebar/Collections/Collection/index.js`
- 变更：
  - 将当前 `<GitAction onClose={...} />` 改为传入 `collectionUid`（必要时也传 `collectionPath`）。
- 原因：
  - Git 操作必须绑定当前集合路径；当前组件未接收集合上下文。
- 实现方式：
  - 在渲染弹窗处传 `collectionUid={collection.uid}`。

### 2) 新增前端 Git thunk（查询 + 执行）

- 文件：`packages/bruno-app/src/providers/ReduxStore/slices/collections/actions.js`
- 变更：
  - 新增以下 thunk（命名按现有风格）：
    - `getCollectionGitOverview(collectionUid)`：获取弹窗关键信息
    - `gitFetch(collectionUid, processUid)`：执行 fetch
    - `gitPull(collectionUid, processUid)`：执行 pull（策略固定 `--no-rebase`）
    - `gitPush(collectionUid, processUid)`：执行 push
  - 统一通过 `ipcRenderer.invoke('renderer:xxx', payload)` 调 Electron。
- 原因：
  - UI 层不应直接拼装路径与策略；由 thunk 负责从 store 定位 collection 并调用 IPC。
- 实现方式：
  - thunk 内通过 `findCollectionByUid` 获取 `collection.pathname`。
  - 调用新 IPC：
    - `renderer:get-collection-git-overview`
    - `renderer:git-fetch`
    - `renderer:git-pull`
    - `renderer:git-push`

### 3) 扩展 Electron Git IPC

- 文件：`packages/bruno-electron/src/ipc/git.js`
- 变更：
  - 在保留 clone 逻辑基础上，新增 handler：
    - `renderer:get-collection-git-overview`
    - `renderer:git-fetch`
    - `renderer:git-pull`
    - `renderer:git-push`
- 原因：
  - 现有 git 核心能力在 `utils/git.js`，但没有被 UI 操作链路暴露。
- 实现方式：
  - 复用 `utils/git.js` 中函数：
    - `getCollectionGitRootPath(collectionPath)`
    - `getCollectionGitData(gitRootPath, collectionPath)`（取分支与远端）
    - `getAheadBehindCount(gitRootPath)`（取 ahead/behind）
    - `fetchChanges(gitRootPath, 'origin')`
    - `pullGitChanges(mainWindow, { gitRootPath, processUid, remote: 'origin', remoteBranch: currentBranch, strategy: '--no-rebase' })`
    - `pushGitChanges(mainWindow, { gitRootPath, processUid, remote: 'origin', remoteBranch: currentBranch })`
  - overview 返回结构固定为：
    - `gitRootPath`
    - `currentBranch`
    - `remoteUrl`
    - `ahead`
    - `behind`
  - 非 git 仓库或缺少远端时返回可识别错误（前端 toast / 状态展示）。

### 4) 重写 GitAction 弹窗 UI 与交互

- 文件：`packages/bruno-app/src/components/Sidebar/GitAction/index.js`
- 变更：
  - 删除当前 NewFolder 表单逻辑，改为 Git 操作面板：
    - 头部信息区：当前分支、origin URL、ahead/behind
    - 操作按钮区：Fetch / Pull / Push
    - 结果区：最近一次操作结果（成功/失败消息）
    - 进行中状态：禁用按钮，显示加载文案
    - 自动刷新：每次操作成功后自动重新拉取 overview
- 原因：
  - 满足弹窗能力目标并避免与当前功能错位。
- 实现方式：
  - 入参：`{ collectionUid, onClose }`
  - `useEffect` 打开即加载 overview
  - 每个操作生成 `processUid`，调用 thunk
  - 操作完成后：
    1. 展示结果摘要
    2. 自动 `getCollectionGitOverview` 刷新信息

### 5) 轻量样式调整

- 文件：`packages/bruno-app/src/components/Sidebar/GitAction/StyledWrapper.js`
- 变更：
  - 由当前“advanced-options”样式改为适配信息卡片、按钮组、状态文本的样式。
- 原因：
  - 现有样式与新 UI 结构不匹配。

## Assumptions & Decisions

- 已确认决策：
  - 关键信息展示：`当前分支 + origin 远端 + ahead/behind`
  - 目标策略：固定 `origin + 当前分支`
  - 刷新策略：操作后自动刷新并回显结果
- 实现决策：
  - `pull` 默认使用 `--no-rebase`（避免强制快进失败导致不可用）。
  - 不在本次范围加入远端/分支下拉选择器。
  - 不在本次范围加入 commit/stash/冲突解决 UI，仅聚焦 pull/push/fetch。

## Verification Steps

1. 静态检查  
- 运行 `npm run lint --workspace=packages/bruno-app`  
- 运行 `npm run lint --workspace=packages/bruno-electron`

2. 功能回归（手工）  
- 在已绑定 git 仓库且配置了 origin 的 collection 上打开“Git Actions”：
  - 可看到分支、远端 URL、ahead/behind。
  - 点击 Fetch 成功后自动刷新计数。
  - 点击 Pull 成功后自动刷新计数。
  - 点击 Push 成功后自动刷新计数。
- 在非 git 目录或远端缺失场景：
  - 弹窗显示可理解错误，不崩溃。

3. 关键链路检查  
- 前端 thunk 调用 IPC 名称与 payload 对齐。  
- `main:update-git-operation-progress` 不受影响（clone 仍可用）。  
- 原“Git Actions”菜单入口仍可正常打开弹窗并关闭。

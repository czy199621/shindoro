# AGENT 指南

## 目的

这个仓库是一个名为 `Shindoro` 的 TypeScript 卡牌对战原型项目。

这份文件用于给进入仓库的编码代理或协作者提供第一站说明，帮助改动安全落地，避免破坏项目构建、规则流程或需要同步维护的构建产物。

## 快速开始

常用命令：

```powershell
npm run build
npm start
npm test
```

它们的作用：

- `npm run build`
  - 将 `src/` 编译到 `dist/`。
- `npm start`
  - 先重新构建，再启动本地静态服务器，默认端口为 `4173`。
- `npm test`
  - 先重新构建，再使用 Node 自带测试运行器执行引擎测试。

## 核心事实

- 源代码的真实来源在 `src/`。
- 运行时和测试当前都依赖 `dist/`。
- `dist/` 虽然是生成目录，但它也是当前仓库工作流的一部分，源码变更后需要保持同步。
- 这个项目虽然使用了 `.tsx` 文件，但它不是 React 运行时项目。
- 当前 UI 渲染方式主要是 HTML 字符串拼接加 DOM 事件委托。

## 项目地图

根目录关键文件：

- `package.json`
  - 构建、启动和测试脚本。
- `index.html`
  - 加载 `src/style.css` 和 `dist/main.js`。
- `server.js`
  - 最小化静态文件服务器。
- `game_rule.md`
  - 游戏规则参考文档。
- `game_design.md`
  - 更高层的设计说明。
- `memory-bank/architecture.md`
  - 面向人的架构摘要文档。
- `memory-bank/progress.md`
  - 修改履历与阶段性进展记录。

源码结构：

```text
src/
├─ main.ts
├─ App.tsx
├─ style.css
├─ types.ts
├─ components/
├─ data/
├─ engine/
└─ store/
```

## 应用结构说明

### 入口与渲染

- `src/main.ts`
  - 通过调用 `mountApp()` 启动应用。
- `src/App.tsx`
  - 顶层界面渲染入口。
  - 在 `setup`、`mulligan` 和 `game` 三个界面间切换。
  - 使用 `data-action` 属性和事件委托，而不是组件内部绑定事件。

### UI 编排层

- `src/store/useGameStore.ts`
  - UI 交互和游戏引擎之间的桥接层。
  - 持有只属于 UI 的短期状态，例如 setup 选择、mulligan 选择、当前攻击者和 AI 定时器状态。

### 领域数据层

- `src/data/cards.ts`
- `src/data/characters.ts`
- `src/data/talents.ts`
- `src/data/decks.ts`

这些文件定义了引擎和 UI 共同使用的内容模型。

### 游戏引擎层

- `src/engine/gameState.ts`
  - 主门面类：`ShinDoroGame`
- `src/engine/rules.ts`
  - 底层辅助函数和优势值计算
- `src/engine/effects.ts`
  - 出牌、战斗、抽牌、召唤、陷阱、死亡和胜负结算
- `src/engine/phases.ts`
  - 回合与 mulligan 流程
- `src/engine/slotResolver.ts`
  - Jump / God Draw 槽位机制
- `src/engine/ai.ts`
  - AI 天赋预设和行为评分

### 测试层

- `tests/engine.test.js`
  - 从 `dist/` 导入，而不是从 `src/` 导入
  - 覆盖核心引擎行为和关键规则检查点

## 代理工作规则

### 1. 改 `src/`，不要直接改 `dist/`

如果需要修改行为，优先在 `src/` 中改。

`dist/` 只应被视为构建产物。源码改动后，需要重新构建，让 `dist/` 和源码树保持一致。

### 2. 保持现有 UI 模式

除非任务明确要求，不要把这个项目重构成 React 状态驱动组件架构。

当前代码库依赖的是：

- 基于字符串的 HTML 渲染
- 基于 `data-action` 的交互分发
- 由 store 驱动的状态更新

新的 UI 工作应延续这个模式，除非任务本身就是一次明确的架构重写。

### 3. 尊重引擎边界

当修改玩法行为时：

- 引擎逻辑放在 `src/engine/`
- 静态内容放在 `src/data/`
- 纯 UI 行为放在 `src/store/` 或 `src/components/`

避免把渲染逻辑混入引擎模块。

### 4. 源码改动后重新构建

由于 `index.html` 和测试都使用 `dist/`，所以任何有意义的源码修改后，通常都应该执行：

```powershell
npm run build
```

如果改动影响了引擎行为，优先再执行：

```powershell
npm test
```

### 5. 规则变化时同步文档

如果你修改了游戏规则、卡牌行为、槽位规则或回合流程，请检查这些文档是否也需要同步：

- `game_rule.md`
- `game_design.md`
- `memory-bank/architecture.md`
  - 如果架构或文件职责发生变化，也应更新

### 6. 改代码前先确认 `memory-bank/`，改代码后更新 `memory-bank/`

在开始修改代码前，先查看 `memory-bank/` 中已有的项目文档，确认当前结构、约定和上下文，避免在不了解现状的情况下直接动代码。

在完成代码修改后，如果改动影响了项目结构、模块职责、流程、规则理解或后续协作所需的背景信息，也要同步更新 `memory-bank/` 中对应文档。

其中，`memory-bank/progress.md` 应作为优先检查和优先更新的修改履历文件，用来记录关键改动、对应文件和变更目的。

## 建议的改动路径

实现任务时，建议按这个顺序推进：

1. 先判断改动属于哪一层：UI、store、data、engine 或 docs。
2. 改代码前先查看 `memory-bank/` 中相关文档，再读最接近的现有模块。
3. 在 `src/` 中做最小但完整的修改。
4. 重新构建以同步 `dist/`。
5. 如果改动影响规则或引擎行为，运行测试。
6. 改代码后检查并更新 `memory-bank/`，确保知识库与实现一致。
7. 如果项目心智模型发生变化，再同步更新其他文档。

## 高风险区域

这些位置需要格外小心：

- `src/types.ts`
  - 这里的结构变化会波及整个项目。
- `src/engine/gameState.ts`
  - 中央调度器，小改动可能影响多个流程。
- `src/engine/effects.ts`
  - 玩法逻辑密集，行为影响面广。
- `src/engine/phases.ts`
  - 回合顺序和待处理选择流很容易回归。
- `src/store/useGameStore.ts`
  - UI 逻辑和 AI 调度在这里汇合。

## 已知注意点

- 测试读取的是 `dist/`，所以过期的构建产物会造成误导性结果。
- `index.html` 直接加载 `src/style.css`，但逻辑来自 `dist/main.js`。
- 某些终端如果不是 UTF-8 编码，中文可能会显示成乱码。
- `public/cards/` 目前更像是占位或预留资源目录，运行时未必已经完整接入。

## 推荐默认做法

- 优先选择小而局部的改动，而不是大规模重构。
- 保持现有命名方式和模块边界。
- 对引擎或规则改动，尽量补测试。
- 在把动态内容注入 HTML 时，使用 `escapeHtml()` 处理用户可见文本。
- 如果需要快速回顾架构，先读 `memory-bank/architecture.md`。
- 如果需要确认最近做过什么改动，先读 `memory-bank/progress.md`。

## 如果你只想先看一个文件

- 玩法 bug：从 `src/engine/gameState.ts` 开始
- 渲染 bug：从 `src/App.tsx` 或 `src/components/Board.tsx` 开始
- 选择或状态 bug：从 `src/store/useGameStore.ts` 开始
- 卡牌、天赋或数值定义：从 `src/data/` 开始

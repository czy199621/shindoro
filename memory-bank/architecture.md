# Architecture

## 项目概览

`Shindoro` 是一个卡牌对战原型项目，代码主体位于 `src/`，通过 TypeScript 编译到 `dist/`，再由 `server.js` 提供静态访问。

这个项目虽然使用了 `.tsx` 文件，但当前并不是 React 运行时项目。`src/components/` 和 `src/App.tsx` 主要是在拼接 HTML 字符串，再通过事件委托驱动交互。

## 技术栈与运行方式

- 语言：TypeScript
- 模块系统：ES Modules
- 构建：`tsc -p tsconfig.json`
- 启动：`node server.js`
- 测试：Node 原生测试框架 `node:test`

常用命令：

```powershell
npm run build
npm start
npm test
```

## 根目录结构

```text
.
├─ src/                    # 源码
├─ dist/                   # 构建产物，index.html 直接引用
├─ memory-bank/            # 面向代理和协作者的项目知识库
├─ tests/                  # 测试
├─ public/                 # 静态资源说明与预留目录
├─ game_rule.md            # 游戏规则文档
├─ game_design.md          # 设计说明文档
├─ index.html              # 页面入口，加载 src/style.css 和 dist/main.js
├─ package.json            # 脚本定义
├─ server.js               # 静态文件服务器
└─ tsconfig.json           # TypeScript 编译配置
```

## `src/` 结构拆解

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

### 入口层

- `src/main.ts`
  - 查找 `#app` 根节点。
  - 调用 `mountApp(app)` 启动整个应用。

- `src/App.tsx`
  - 负责根据当前 `screen` 渲染 `setup / mulligan / game` 三个阶段。
  - 用 `data-action` 做统一事件分发。
  - 把用户点击转换成 `store` 方法调用。
  - 在每次渲染后安排 AI 回合执行。

- `src/style.css`
  - 定义整套界面样式，包括 setup、battle、HUD、卡牌、弹层和响应式布局。

- `src/types.ts`
  - 整个项目的核心类型中心。
  - 包含游戏状态、卡牌定义、角色、天赋、效果、AI 决策、回合阶段等类型声明。

### 状态与编排层

- `src/store/useGameStore.ts`
  - 这是 UI 和底层游戏引擎之间的桥接层。
  - 内部持有 `ShinDoroGame` 实例。
  - 维护只属于前端交互的状态，比如：
    - 角色选择
    - 天赋选择
    - Mulligan 勾选
    - 当前选中的攻击者
    - AI 延时定时器
  - 向 UI 暴露统一操作接口，比如 `startGame()`、`playCard()`、`attackHero()`、`endTurn()`。

### 渲染层

- `src/components/Board.tsx`
  - 游戏主战场渲染器，负责战斗界面、手牌区、场地区、侧栏和日志等内容。

- `src/components/Card.tsx`
  - 各类卡牌视图渲染，包括手牌、Mulligan 卡牌、随从卡、持续物卡。

- `src/components/PlayerHUD.tsx`
  - 玩家 HUD 区块渲染，展示血量、法力、角色信息等。

- `src/components/ResolutionPanel.tsx`
  - 负责待处理选择和结算提示内容。

- `src/components/SlotMeter.tsx`
  - 渲染 Jump / God Draw 进度条与相关展示。

- `src/components/html.ts`
  - 提供 `escapeHtml()`，用于基础的 HTML 转义。

### 数据层

- `src/data/cards.ts`
  - 卡牌总表 `CARD_LIBRARY`。
  - 提供 `CARD_LOOKUP` 和 `getCardDefinition()`。

- `src/data/characters.ts`
  - 角色定义与角色被动信息。

- `src/data/talents.ts`
  - 天赋定义、花费、上限与效果配置。

- `src/data/decks.ts`
  - 起始卡组和保留卡组配置。

### 游戏引擎层

- `src/engine/gameState.ts`
  - 核心门面类 `ShinDoroGame`。
  - 持有全局 `GameState`。
  - 对外暴露游戏生命周期与交互方法。
  - 也是上层 `store` 直接调用的主要入口。

- `src/engine/rules.ts`
  - 基础规则与通用工具函数。
  - 包括运行时卡牌构建、洗牌、威胁值计算、优势值计算、空玩家状态创建等。

- `src/engine/effects.ts`
  - 处理出牌、攻击、抽牌、召唤、亡语、陷阱触发、死亡检测、胜负判断等效果执行。

- `src/engine/phases.ts`
  - 处理回合阶段流转。
  - 包括 Mulligan、回合开始、起始队列处理、待选项处理、回合结束、AI 回合执行。

- `src/engine/slotResolver.ts`
  - 处理 Jump / God Draw 槽位相关规则、阈值奖励和角色槽位能力。

- `src/engine/ai.ts`
  - AI 天赋预设与行动决策逻辑。
  - 包括出牌评分、攻击评分、God Draw 选牌和回合动作选择。

## `memory-bank/` 结构

```text
memory-bank/
├─ architecture.md         # 项目结构、模块职责和运行链路
└─ progress.md             # 修改履历与阶段性进展记录
```

- `memory-bank/architecture.md`
  - 用于快速理解仓库结构、模块边界和运行方式。

- `memory-bank/progress.md`
  - 用于记录重要修改的时间、目的、影响范围和后续注意事项。
  - 适合作为代理在改代码前后的优先检查文档。

## `dist/` 的角色

`dist/` 是 `src/` 的编译输出目录，目前已提交到仓库中，且被运行链路直接使用：

- `index.html` 直接加载 `./dist/main.js`
- `tests/engine.test.js` 直接从 `dist/` 导入模块

这意味着：

1. 修改 `src/` 后，需要重新构建，`dist/` 才会同步更新。
2. 测试依赖最新构建结果，而不是直接执行 `src/`。

## 测试结构

- `tests/engine.test.js`
  - 主要验证核心规则和回合逻辑。
  - 当前覆盖点包括：
    - 优势值计算
    - 槽位增长断点
    - 角色被动生效
    - Mulligan 后进入主回合
    - 随从跨回合后可攻击

## 运行链路

项目当前的实际执行路径可以概括为：

1. `npm run build` 使用 TypeScript 将 `src/` 编译到 `dist/`
2. `index.html` 加载 `src/style.css` 和 `dist/main.js`
3. `dist/main.js` 对应 `src/main.ts`，调用 `mountApp()`
4. `App.tsx` 根据 `store.getState()` 渲染不同界面
5. `useGameStore.ts` 接收 UI 操作，并转发给 `ShinDoroGame`
6. `ShinDoroGame` 再调用 `rules / effects / phases / slotResolver / ai` 等模块完成规则结算
7. `server.js` 负责把这些静态文件通过本地端口提供出来

## 维护建议

- 当前 `memory-bank/` 已包含结构文档和修改履历文档。

- 如果后续继续扩展 `memory-bank/`，建议再补充：
  - `game-flow.md`：记录 setup 到 battle 的状态流转
  - `engine-map.md`：专门整理引擎模块关系
  - `data-dictionary.md`：梳理卡牌、角色、天赋的数据结构

- 当前项目一个很重要的实现特点是：
  - UI 层是“字符串渲染 + DOM 事件委托”
  - 游戏逻辑层是“集中式状态机 + 规则模块”
  - 测试和运行都依赖 `dist/` 编译产物

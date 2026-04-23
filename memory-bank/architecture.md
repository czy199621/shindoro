# Architecture

## 目的

`memory-bank/architecture.md` 是这个项目给代理和协作者使用的结构入口文档。
修改代码前应先查看这里与 `memory-bank/progress.md`，修改后再回写相关变更。

## 当前项目状态

- 项目类型：TypeScript 卡牌对战原型
- 规则基准：`design/game_rule.md` v1.2
- 角色数量：6 名角色，编号 A-F
- 卡组结构：`50` 张主卡组 + `3` 张备牌库
- 天赋体系：先后手动态定价，支持座位限制
- 关键阶段：`turnStart -> slotResolution -> draw -> mainTurn -> combat -> turnEnd`
- 测试方式：测试直接运行 `dist/` 下的编译产物

## 根目录

- `AGENT.md`
  - 代理协作规则与默认工作方式
- `README.md`
  - 面向项目使用者的启动说明与概览
- `SKILL.md`
  - 内容更新任务的执行准则
- `.gitignore`
  - 仓库级忽略规则
  - 当前至少排除 `node_modules/`，避免把本地依赖目录纳入版本控制
- `design/`
  - 规则文档与设计文档
- `memory-bank/`
  - 持续维护的项目记忆
- `src/`
  - 源码
- `dist/`
  - TypeScript 编译产物
- `tests/`
  - 基于 `dist/` 的测试
- `package.json`
  - 构建、启动、测试命令
  - 现在显式声明 `typescript` 开发依赖，避免干净环境缺少 `tsc`
- `server.js`
  - 本地静态服务入口
- `start-game.bat`
  - Windows 下一键启动入口
  - 调用 `start-game.ps1`
- `update-and-start.bat`
  - Windows 下的自动更新启动入口
  - 调用 `start-game.ps1 -AutoUpdate`
- `start-game.ps1`
  - Windows 生命周期启动器
  - 启动 `npm start` 后使用独立浏览器窗口打开游戏
  - 游戏窗口关闭后自动关闭服务器进程树
  - 若服务启动失败，会打印 `npm start` 的输出帮助定位问题
  - 会额外检查本地 `tsc` 是否存在，避免旧的空 `node_modules` 误判为可启动
  - 支持 `-AutoUpdate` 参数，会在工作区干净时执行 `git pull --ff-only origin 当前分支`
  - 若存在本地改动、缺少 `git`、缺少 `origin` 或拉取失败，会跳过更新并继续启动本地版本

## 源码结构

### `src/App.tsx`

- UI 顶层入口
- 负责 `setup / mulligan / game` 三个主要界面切换
- 负责点击事件分发与手动攻击动作的 UI 触发

### `src/store/useGameStore.ts`

- UI 与 `ShinDoroGame` 的桥接层
- 将游戏状态、玩家操作与 AI 执行整理成前端可直接消费的接口
- 包含只属于表现层的临时 UI 状态，例如攻击前冲与命中抖动使用的 `attackFx`

### `src/types.ts`

- 全局共享类型
- 包含角色、卡牌、天赋、阶段、效果动作与游戏状态结构

## 数据层 `src/data/`

### 根入口

- `src/data/cards.ts`
  - 卡牌总入口
  - 对外提供 `CARD_LIBRARY`、`CARD_LOOKUP`、`getCardDefinition()`
- `src/data/characters.ts`
  - 角色总入口
  - 对外提供 `CHARACTERS`、`CHARACTER_LOOKUP`
- `src/data/talents.ts`
  - 天赋总入口
  - 对外提供 `TALENTS`、`TALENT_LOOKUP`、`getTalentCost()`、`isTalentAvailableForSeat()`
- `src/data/decks.ts`
  - 六名角色的默认卡组配置

### 角色模块

- `src/data/characters/characterA.ts`
- `src/data/characters/characterB.ts`
- `src/data/characters/characterC.ts`
- `src/data/characters/characterD.ts`
- `src/data/characters/characterE.ts`
- `src/data/characters/characterF.ts`

每个角色文件独立维护：

- 角色基础资料
- 被动能力
- `jump10 / jump13` 对应的大招配置

### 卡牌模块

- `src/data/cards/minions.ts`
  - 全部使魔定义
- `src/data/cards/spells.ts`
  - 全部法术定义
- `src/data/cards/persistents.ts`
  - 全部持续物定义
- `src/data/cards/traps.ts`
  - 全部陷阱定义

卡牌现在按类型拆分，新增或修改某一类卡牌时，优先只动对应模块，再由 `src/data/cards.ts` 聚合输出。

### 天赋模块

- `src/data/talents/survival.ts`
- `src/data/talents/resource.ts`
- `src/data/talents/deckControl.ts`
- `src/data/talents/combat.ts`
- `src/data/talents/spell.ts`
- `src/data/talents/burst.ts`
- `src/data/talents/slotControl.ts`

天赋现在按功能类别拆分，动态费用、可选座位与重复限制都保留在各自的 `TalentDefinition` 内。

## 引擎层 `src/engine/`

- `gameState.ts`
  - `ShinDoroGame` 主入口
  - 负责游戏状态创建、角色/天赋应用与对外 API
- `phases.ts`
  - 阶段推进、回合开始/结束、Mulligan 与 AI 回合调度
- `effects.ts`
  - 卡牌与能力效果执行
- `slotResolver.ts`
  - 跳脸槽与神抽槽计算、角色大招解析
- `rules.ts`
  - 通用规则、优势值计算、运行时对象创建
- `ai.ts`
  - AI 选天赋与出牌/攻击决策

## 组件层 `src/components/`

- `Board.tsx`
  - 棋盘与战场区展示
- `Card.tsx`
  - 单卡渲染
- `PlayerHUD.tsx`
  - 玩家面板、生命、法力、手牌等摘要信息
- `ResolutionPanel.tsx`
  - 槽位与额外选择的提示面板
- `SlotMeter.tsx`
  - 槽位进度展示

当前攻击撞击特效也在这一层完成：

- 攻击方前冲
- 受击方抖动与闪光
- 由 `store.uiState.attackFx` 驱动
- 不影响引擎层的真实伤害与战斗规则

## 运行链路

1. `npm run build`
   - 将 `src/` 编译到 `dist/`
2. `src/main.ts`
   - 调用应用挂载逻辑
3. `src/App.tsx`
   - 读取 `useGameStore` 状态并渲染界面
4. `useGameStore.ts`
   - 调用 `ShinDoroGame`
5. `ShinDoroGame`
   - 分派到 `phases / effects / slotResolver / rules / ai`

## 测试与构建

- `npm run build`
  - 只负责编译
- `npm test`
  - 会先重新构建，再跑 `tests/engine.test.js`
- 因为测试依赖 `dist/`，只改 `src/` 后如果不构建，测试不会看到最新代码

## 修改约定

- 改代码前先确认：
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
  - `design/game_rule.md`
- 改代码后要更新：
  - `memory-bank/progress.md`
  - 如结构有变化，再更新 `memory-bank/architecture.md`
- 写代码尽量模块化，避免把过多职责堆进单个文件或函数
- 若只是调整数据内容，优先保持 `src/data/*.ts` 根入口接口稳定，减少联动改动
- 视觉特效优先放在 UI / store 层，不要把纯表现状态塞进 `GameState`

## 关联修正结论

- 当前业务代码统一从 `src/data/cards.ts`、`src/data/characters.ts`、`src/data/talents.ts` 取数
- 因为根入口保持稳定，角色、卡牌、天赋的模块化拆分不会强迫 UI、引擎、测试同步改 import

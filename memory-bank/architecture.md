# Architecture

## 2026-04-24 Desktop Battle Layout

- `src/components/Board.tsx`
  - The battle screen now uses two horizontal battlefield halves plus a compact hand zone, so desktop screens can spend width on the board instead of stacking every section vertically.
  - The in-match header now separates the left-side title/status copy from a centered battle-info strip, so turn and phase information sits in the visual middle of wide desktop headers.
  - The battle log now lives in the right side of the in-match header, while the right sidebar focuses on the momentum panel only.
  - The header log card is intentionally minimal and now shows only the latest log entries; the restart control has moved into the hand-zone toolbar.
- `src/style.css`
  - Added `.game-shell`-scoped desktop layout rules that keep the battle UI inside the viewport and push overflow into internal panels such as the battle log instead of the page itself.
  - The in-match layout no longer caps desktop width at a fixed maximum and now uses viewport-aware `clamp(...)` sizing for the sidebar, HUD columns, and card widths.
  - Rows that hold cards now prefer fixed readable card widths with internal horizontal scrolling instead of squeezing cards to fit, and the momentum panel now stacks player and AI breakdowns vertically for readability inside the sidebar.
  - Hero passive text in the HUD is now treated as its own readable info block instead of being squeezed into a narrow corner.
  - HP and Mana resource badges are now compacted further so their labels stay fully inside the badge, and slot badges use a dedicated compact header/note layout to fit more cleanly inside player HUD panels.
- `src/components/SlotMeter.tsx`
  - Slot meter cards now expose dedicated header, label, count, and note classes so the HUD can tune slot badge density without affecting unrelated panels.
  - Slot meter cards currently render only the slot name, progress bar, and counter, without extra explanatory copy.
- `src/components/MomentumPanel.tsx`
  - The momentum panel header now shows just the title and current V badge, without the earlier descriptive subtitle.
  - When there is no previous settlement result yet, the panel now omits the old default settlement hint box instead of showing placeholder copy.

## 2026-04-25 React Battle Board And Pixi Effects

- Battle screen rendering
  - `src/components/react/ReactBattleBoard.tsx` is now the active renderer for `state.screen === "game"`.
  - Setup and mulligan still use the legacy string-template compatibility path in `src/App.tsx`.
  - The battle screen is composed from real React components for cards, HUDs, board zones, controls, modals, battle log, and momentum display.
- React component ownership
  - `src/components/react/CardView.tsx` owns hand cards, board minions, persistent cards, traps, keyword badges, stat badges, and card inspection data.
  - `src/components/react/PlayerHUDView.tsx` owns hero/player HUD display including HP, mana, hand/deck counts, jump slot, and god-draw slot.
  - `src/components/react/ReactBattleBoard.tsx` owns board composition, player actions, pending choice modal, game-over modal, effect banner, battle log, momentum panel, and the card-detail tooltip portal.
- PixiJS boundary
  - `src/game-view/pixi/PixiBattlefieldHost.tsx` receives `GameState`, `attackFx`, and `cardFx`.
  - PixiJS is display-only and does not decide legal actions, damage, or turn flow.
  - PixiJS owns non-interactive foreground battle effects: attack trails, hit bursts, floating damage numbers, summon particles, and spell/trap/persistent bursts.
  - React remains responsible for readable UI state such as selected attackers, targetability, card text, buttons, and modals.
- Pixi coordinate model
  - React battle entities expose `data-pixi-entity-id`.
  - Hero HUDs use `P1_hero` and `P2_hero`; minions, persistents, and traps use their `instanceId`.
  - `PixiBattlefieldHost` resolves effect origins and targets from DOM element centers before falling back to estimated battlefield positions.
  - Damage snapshots preserve the last resolved position so damage numbers and hit bursts can still appear when a destroyed minion has already left the DOM.
- Layering model
  - The old Pixi battlefield underlay was removed because it polluted the battle layout.
  - `PixiBattlefieldHost` now creates only the fixed `pixi-battlefield-effects` canvas.
  - The Pixi effects layer uses `pointer-events: none`; modal overlays and the card-detail tooltip sit above it through higher z-index layers.
- Battle layout
  - The battle header is a compact status strip.
  - The main battle view uses stable viewport rows for enemy field, player field, and player hand.
  - The action log lives in the right sidebar below the momentum panel.
  - Cards, minions, persistents, HUDs, momentum, and log panels use tighter height constraints and internal overflow so long text does not stretch the board.
- Card detail tooltip
  - Hovering or focusing a hand card, board minion, persistent card, or trap shows the unified card-detail tooltip.
  - Unplayable hand cards still expose hover/focus inspection via `aria-disabled` plus a guarded click handler.
  - The tooltip shows name, type, cost, tags, stats, description, summarized effects, flavor text, and current status.

## 2026-04-25 公共备牌库终结者与大魔法

- 公共备牌库
  - `src/data/cards/minions/sideboardFinishers.ts` 维护 4 张公共 13 点神抽终结者。
  - `src/data/cards/minions.ts` 继续作为使魔聚合入口，并导出公共终结者模块。
  - `src/data/decks.ts` 中每名角色的 `sideboard` 当前统一接入 4 张公共终结者。
- 大魔法
  - `src/data/cards/spells.ts` 新增 6 张大魔法：全场清场、单向清场、持续魔法拆除、触发魔法拆除和下回合费用减半。
- 引擎动作
  - `src/types.ts` 扩展了额外回合、肃清、磨牌到指定剩余数、生命互换、清场、拆除持续魔法、拆除陷阱和费用倍率等效果动作。
  - `src/engine/effects.ts` 实现这些动作，并补充吸血、必杀、潜行指定限制和连击攻击次数的基础处理。
  - `src/engine/phases.ts` 处理额外回合、额外回合失败败北、回复关键词和下回合费用倍率。
  - `src/engine/slotResolver.ts` 会在 `slotSeal` 使魔在场时阻止双方发动跳脸与神抽。
- 文档同步
  - `design/game_rule.md` 记录公共终极备牌库、大魔法和看破当前数字版口径。
  - `design/game_design.md` 记录本次更新的实现落点。
  - `design/minion.md` 追加公共备牌库终结者条目。

## 2026-04-24 Design And Rule Sync

- `SKILL.md`
  - Now requires content updates to synchronize `design/game_design.md`.
  - Now requires rule updates to synchronize `design/game_rule.md`.

## 2026-04-24 Agent Skill Gate

- `AGENT.md`
  - Now explicitly requires agents to read `SKILL.md` before starting content-update, design-sync, rule-document, or catalog-maintenance tasks.
  - Also requires minion changes to keep the minion catalog document in sync.

## 2026-04-24 Minion Modules

- `src/data/cards/minions.ts`
  - Now acts as a stable aggregation entry for minion data.
- `src/data/cards/minions/lowCost.ts`
  - Contains low-cost baseline minions.
- `src/data/cards/minions/midCost.ts`
  - Contains mid-cost tempo and value minions.
- `src/data/cards/minions/highCost.ts`
  - Contains higher-cost finisher minions.
- `src/data/cards/minions/guardPackage.ts`
  - Contains the newer guard-focused minion package and generated token.

## 2026-04-24 Update

- `src/data/cards/minions.ts`
  - Added the new guard package minions: `landmine_girl`, `day_off`, `weekend_overtime`, `dorm_matron`, `iron_rice_bowl`, `three_phase_plug`, `top_donor`.
- `src/engine/effects.ts`
  - Added support for `onAttacked`, `addCardToHand`, `grantAdjacentGuard`, and `buffSelfIfHeroHpBelow`.
  - Enemy magic targeting now respects `magicRes`.
- `src/engine/rules.ts`
  - Board threat now respects enemy `menace` units during momentum calculation.
- `design/minion_codex.md`
  - Added a minion catalog document for all current minions and the new guard package.

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
  - 支持 `-AutoUpdate` 参数
  - 自动更新现在优先走 Git 工作区更新；若本机没有可用的 Git 更新条件，则回退到 GitHub 分支压缩包更新
  - 会在无 Git 更新模式下生成 `.shindoro-update-state.json`，用于记录最近一次成功更新的提交与文件哈希
  - 若 Git 工作区存在未提交改动，或无 Git 模式下检测到上次更新后的本地文件改动，会跳过更新并继续启动本地版本
- `update-source.json`
  - 无 Git 自动更新的默认源配置
  - 当前指向 GitHub 仓库的 `main` 分支压缩包

## 源码结构

### `src/App.tsx`

- UI 顶层入口
- 负责 `setup / mulligan / game` 三个主要界面切换
- 负责点击事件分发与手动攻击动作的 UI 触发

### `src/store/useGameStore.ts`

- UI 与 `ShinDoroGame` 的桥接层
- 将游戏状态、玩家操作与 AI 执行整理成前端可直接消费的接口
- 包含只属于表现层的临时 UI 状态，例如攻击前冲与命中抖动使用的 `attackFx`
- 现在也负责基于状态差分生成 `cardFx` 队列，用于统一驱动召唤、放置、法术和陷阱的演出
- AI 回合改为逐动作推进，便于在每一步之间插入卡牌特效与重新渲染

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
  - 组装实时势能面板、战斗日志与主要对局侧边栏
- `Card.tsx`
  - 单卡渲染
  - 使魔统一展示攻击力、血量与威胁值三项属性
- `EffectLayer.tsx`
  - 渲染法术、陷阱、召唤、放置等卡牌演出的中央效果横幅
- `MomentumPanel.tsx`
  - 实时展示双方的手牌分、血量分、威胁值分、特殊扣分与总势能分
  - 同时显示上一次回合结束后的势能结算结果
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

当前卡牌特效也在这一层完成：

- 召唤使魔时的新卡入场动画
- 放置持续物 / 盖伏陷阱时的卡片落位动画
- 法术发动 / 陷阱触发时的中央效果横幅
- 由 `store.uiState.cardFx` 和 `cardFxQueue` 驱动

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

## 2026-04-25 架构更新：Vite + React + TypeScript + PixiJS 第一阶段

### 当前前端架构

- 项目已经从原生 DOM 入口迁移到 `Vite + React + TypeScript`。
- `index.html` 现在由 Vite 接管，入口为 `/src/main.tsx`。
- `src/main.tsx` 使用 `react-dom/client` 的 `createRoot()` 挂载 `GameApp`。
- `src/App.tsx` 现在是 React 组件，但为了降低迁移风险，仍通过兼容层调用原有字符串模板渲染函数。
- 当前 UI 仍主要由 `src/components/*.tsx` 的旧模板函数输出 HTML 字符串，React 负责生命周期、点击事件入口和后续组件化承载。
- PixiJS 已加入依赖，并新增 `src/game-view/pixi/PixiBattlefieldHost.tsx` 作为战场 Canvas/WebGL 层的挂载点。
- PixiJS 使用 `React.lazy()` + `Suspense` 按需加载，只在 `state.screen === "game"` 时加载，避免设置页和换牌页提前加载 Pixi bundle。

### 构建与测试分层

- `dist/` 现在是 Vite 的正式网站构建产物，不再是 TypeScript 规则代码编译产物。
- 规则测试改为编译到 `.test-dist/`。
- `tsconfig.test.json` 只编译 `src/data/`、`src/engine/`、`src/types.ts`。
- `tests/engine.test.js` 从 `../.test-dist/...` 导入被测模块。
- `tsconfig.json` 改为 Vite 前端类型检查配置，使用 `moduleResolution: "Bundler"` 与 `noEmit: true`。

### 常用命令

- `npm.cmd start`：启动 Vite dev server，默认地址 `http://localhost:4173/`。
- `npm.cmd run dev`：与 `start` 等价。
- `npm.cmd run build`：类型检查并执行 `vite build`，输出正式站点到 `dist/`。
- `npm.cmd test`：编译规则层到 `.test-dist/`，然后运行 `tests/engine.test.js`。
- `npm.cmd run deploy:aws`：上传 Vite `dist/` 产物到 S3，并刷新 CloudFront。

### AWS 部署架构

- 当前线上托管为：
  - 私有 S3 bucket：`shindoro-demo-bucket`
  - CloudFront distribution：`E3JF5ILT0KVD5W`
  - CloudFront domain：`https://d2j3zgbvkaujmi.cloudfront.net/`
- CloudFront 已设置默认根对象 `index.html`。
- `deploy-aws.ps1` 现在会运行测试和 Vite build，将 `dist/` 内容复制到 `.aws-deploy/`，再同步到 S3 并创建 CloudFront invalidation。
- `deploy-aws.config.json` 为本地私有配置，已加入 `.gitignore`，不要提交。

### 后续迁移方向

- 当前完成的是架构迁移第一阶段，不是完整商业级 UI 重写。
- 下一步建议将 `Card.tsx`、`Board.tsx`、`PlayerHUD.tsx` 等从字符串模板逐步拆成真正 React 组件。
- 后续再将战场、手牌、攻击轨迹、伤害数字等表现逐步交给 PixiJS。
- 引擎层继续保持纯 TypeScript，不让 UI 直接修改规则状态。

# 架构

## 2026-04-24 桌面战斗布局

- `src/components/Board.tsx`
  - 战斗画面改为上下两个战场区加紧凑手牌区，桌面端可以把更多宽度留给棋盘，而不是把所有内容纵向堆叠。
  - 对局标题栏把左侧标题/状态与中间战斗信息分开，让回合和阶段信息位于宽屏视觉中心。
  - 战斗日志放到对局标题栏右侧，右侧边栏主要用于展示势能面板。
  - 标题栏日志卡片保持轻量，只显示最新日志；重新开始按钮移动到手牌区工具栏。
- `src/style.css`
  - 增加 `.game-shell` 范围内的桌面布局规则，让战斗 UI 保持在视口内，把溢出交给战斗日志等内部面板处理。
  - 对局布局不再用固定最大宽度限制桌面端，而是用 `clamp(...)` 根据视口调整侧栏、玩家状态列与卡牌宽度。
  - 卡牌行优先保持固定可读宽度，并在内部横向滚动，避免为了塞满一行把卡牌压得过窄。
  - 角色被动说明在玩家状态区中独立展示，不再挤在狭小角落。
  - 生命和费用徽章进一步压缩，槽位徽章使用专门的标题、标签、计数和注记结构，保证文字不溢出。
- `src/components/SlotMeter.tsx`
  - 槽位卡片暴露独立的标题、标签、计数和注记类名，方便玩家状态区单独调节密度。
  - 当前 React 战斗面板会显示槽位短注记，例如还差几点到 10 点、10 点就绪、13 点已满。
- `src/components/MomentumPanel.tsx`
  - 势能面板标题只显示名称和当前 `V` 值，不再显示旧的描述副标题。
  - 还没有上次结算结果时，面板不再显示旧的默认提示框。

## 2026-04-25 React 战斗面板与 Pixi 特效

- 战斗画面渲染：
  - `src/components/react/ReactBattleBoard.tsx` 是 `state.screen === "game"` 时的实际战斗画面渲染器。
  - 设置页和换牌页仍通过 `src/App.tsx` 使用旧字符串模板兼容路径。
  - 战斗画面由真实 React 组件组合卡牌、玩家状态、战场区域、按钮、弹窗、战斗日志和势能展示。
- React 组件职责：
  - `src/components/react/CardView.tsx` 负责手牌、场上使魔、持续卡、盖伏卡、关键词徽章、属性徽章、可用状态和卡牌检视数据。
  - `src/components/react/PlayerHUDView.tsx` 负责角色/玩家状态展示，包括生命、法力、手牌/牌库数量、跳脸槽、神抽槽和槽位就绪说明。
  - `src/components/react/ReactBattleBoard.tsx` 负责战斗画面组合、玩家操作、当前建议、待处理选择弹窗、游戏结束弹窗、效果横幅、战斗日志、势能面板和卡牌详情提示。
- PixiJS 边界：
  - `src/game-view/pixi/PixiBattlefieldHost.tsx` 接收 `GameState`、`attackFx` 和 `cardFx`。
  - PixiJS 只负责显示特效，不决定合法行动、伤害或回合流程。
  - PixiJS 负责非交互前景战斗特效：攻击轨迹、命中特效、浮动伤害数字、召唤粒子、法术/盖伏/持续物爆发。
  - React 仍负责可读 UI 状态，例如已选攻击者、可选目标、卡牌文字、按钮和弹窗。
- Pixi 坐标模型：
  - React 战斗实体暴露 `data-pixi-entity-id`。
  - 角色状态区使用 `P1_hero` 和 `P2_hero`；使魔、持续物和盖伏使用各自的 `instanceId`。
  - `PixiBattlefieldHost` 优先从 DOM 元素中心点解析特效起点和目标，失败时才回退到估算战场位置。
  - 伤害快照会保留最后一次解析到的位置，因此被破坏使魔离开 DOM 后，伤害数字和命中特效仍能显示在正确位置附近。
- 层级模型：
  - 旧的 Pixi 战场底层被移除，因为它会污染战斗布局。
  - `PixiBattlefieldHost` 现在只创建固定的 `pixi-battlefield-effects` 画布。
  - Pixi 特效层使用 `pointer-events: none`；弹窗和卡牌详情提示通过更高层级显示在它上方。
- 战斗布局：
  - 战斗标题栏是紧凑状态条。
  - 主战斗画面使用稳定的视口行，分别承载敌方场面、玩家场面和玩家手牌。
  - 行动日志位于右侧边栏，在势能面板下方。
  - 卡牌、使魔、持续物、玩家状态、势能和日志面板都使用更严格的高度限制和内部滚动，避免长文本撑开棋盘。
- 卡牌详情提示：
  - 鼠标悬停或键盘聚焦手牌、场上使魔、持续卡或盖伏卡时，会显示统一的卡牌详情提示。
  - 当前不可打出的手牌也能通过 `aria-disabled` 和受保护点击处理保留悬停/聚焦检视。
  - 提示内容包含名称、类型、费用、标签、属性、描述、效果摘要、风味文本和当前状态。

## 2026-04-25 公共备牌库终结者与大魔法

- 公共备牌库
  - `src/data/cards/minions/sideboardFinishers.ts` 维护 5 张公共 13 点神抽终结者。
  - `src/data/cards/minions.ts` 继续作为使魔聚合入口，并导出公共终结者模块。
  - `src/data/decks.ts` 中每名角色的 `sideboard` 当前统一接入 5 张公共终结者。
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

## 2026-04-25 泉亚猫与破坏流天赋

- 角色
  - `src/data/characters/characterG.ts` 新增第 7 名角色泉亚猫。
  - `src/data/characters.ts` 继续作为角色聚合入口，当前角色编号为 A-G。
  - 泉亚猫的大招通过 `discardWithEmptyHandDamage` 表达：正常弃牌；对方手牌不足时转化为生命损失。
- 天赋
  - `src/data/talents/resource.ts` 新增 `mana_breakthrough` 和 `abyssal_mana`，分别把最大费用上限提高到 11 和 12。
  - `src/data/talents/deckControl.ts` 新增 `mental_pollution` 和 `void_backflow`，在自身因手牌上限爆牌时转化为对方弃牌或磨牌。
  - `src/data/talents/survival.ts` 新增 `grace_surge`，让恢复效果额外 +1。
- 引擎
  - `src/engine/effects.ts` 统一处理爆牌联动、弃牌模式、空手惩罚、恢复加成和超过 10 点的临时法力上限。
  - `src/engine/phases.ts` 使用玩家自己的 `maxManaCap` 推进费用上限，并让阶段性恢复读取恢复加成。
  - `src/engine/gameState.ts` 在开局天赋结算时写入新临时标记。
- 测试
  - `tests/engine.test.js` 覆盖新角色数据、天赋价格、费用上限、爆牌联动、恢复加成和泉亚猫大招。

## 2026-04-26 v1.2.1 核心魔法、特殊使魔与槽位上限

- 公共备牌库
  - `src/data/cards/minions/sideboardFinishers.ts` 当前维护 5 张公共终结者。
  - `绝影刺客·瞬`加入公共备牌库，使用 `ignoreGuard` 表示攻击时无视护卫。
  - `虚数之影·卡奥斯`的磨牌动作使用“最多磨 15 张，同时保留 7 张牌库底线”的限制。
- 法术与盖伏
  - `src/data/cards/spells.ts` 新增 `时空篡夺`、`爆裂炎枪`、`流星火雨`、`大魔力宝石`。
  - `src/data/cards/traps.ts` 新增 `魔力干涸`，通过“对手当前费用正好为 5”触发。
  - `src/engine/effects.ts` 支持出牌后和费用增加后检查费用型盖伏。
- 槽位上限
  - `src/engine/slotResolver.ts` 负责自然槽增长上限，默认跳脸槽最多 +3、神抽槽最多 +5。
  - `src/data/talents/slotControl.ts` 增加 `跳脸上限突破`和`神抽上限突破`。
  - `逆境神龛`在场时会让控制者的神抽自然增长上限额外 +1。
- 费用与额外回合
  - `src/engine/rules.ts` 统一判断卡牌能否在当前回合打出，供玩家、AI 和可出牌列表共用。
  - `时空篡夺`通过额外回合费用覆盖，把额外回合的费用上限与当前费用强制设为 12。
- 文档同步
  - `design/game_rule.md`、`design/game_design.md`、`design/minion.md`已记录本次规则、实现和使魔图鉴变化。

## 2026-04-26 对局 UI 亲和度优化

- 顶部状态层
  - `src/components/react/ReactBattleBoard.tsx` 新增“当前建议”状态，根据胜负、待选择、攻击动画、AI 回合、攻击选择、可出牌数和可攻击随从数生成中文提示。
  - 回合阶段统一通过中文标签展示，避免玩家看到引擎内部阶段字段。
- 手牌与卡牌详情
  - `src/components/react/CardView.tsx` 为手牌卡增加可用状态标签；不能打出时显示具体原因。
  - 卡牌详情补齐新版关键词、目标、条件和效果动作的中文说明，减少内部英文和卡牌 id 暴露。
- 玩家状态区
  - `src/components/react/PlayerHUDView.tsx` 将旧的生命和法力英文标签改为“生命 / 法力”。
  - 跳脸槽和神抽槽显示“还差几点”“10 点就绪”“13 点已满”的短说明。
- 样式层
  - `src/style.css` 增加当前建议、手牌可用状态、槽位就绪状态、空区域提示和新版关键词徽章样式。
  - 桌面端标题栏改为三列：标题状态、核心对局数字、当前建议。

## 2026-04-24 Design And Rule Sync

- `SKILL.md`
  - 现在要求内容更新时同步检查并更新 `design/game_design.md`。
  - 现在要求规则更新时同步检查并更新 `design/game_rule.md`。

## 2026-04-24 Agent Skill Gate

- `AGENT.md`
  - 现在明确要求代理在开始内容更新、设计同步、规则文档或图鉴维护任务前先阅读 `SKILL.md`。
  - 现在要求使魔改动必须同步维护使魔图鉴文档。

## 2026-04-24 Minion Modules

- `src/data/cards/minions.ts`
  - 现在作为使魔数据的稳定聚合入口。
- `src/data/cards/minions/lowCost.ts`
  - 维护低费基础使魔。
- `src/data/cards/minions/midCost.ts`
  - 维护中费节奏与资源型使魔。
- `src/data/cards/minions/highCost.ts`
  - 维护高费终结型使魔。
- `src/data/cards/minions/guardPackage.ts`
  - 维护护卫体系使魔与衍生物。

## 2026-04-24 Update

- `src/data/cards/minions.ts`
  - 新增护卫体系使魔：`landmine_girl`、`day_off`、`weekend_overtime`、`dorm_matron`、`iron_rice_bowl`、`three_phase_plug`、`top_donor`。
- `src/engine/effects.ts`
  - 新增对 `onAttacked`、`addCardToHand`、`grantAdjacentGuard` 和 `buffSelfIfHeroHpBelow` 的支持。
  - 敌方法术指定现在会尊重 `magicRes`。
- `src/engine/rules.ts`
  - 势能计算中的场面威胁值现在会读取敌方 `menace` 单位，并按规则压低威胁值。
- `design/minion_codex.md`
  - 曾新增使魔图鉴文档，用于记录当时所有使魔和护卫体系；当前仓库实际维护目标已统一为 `design/minion.md`。

## 目的

`memory-bank/architecture.md` 是这个项目给代理和协作者使用的结构入口文档。
修改代码前应先查看这里与 `memory-bank/progress.md`，修改后再回写相关变更。

## 当前项目状态

- 项目类型：TypeScript 卡牌对战原型
- 规则基准：`design/game_rule.md` v1.2
- 角色数量：7 名角色，编号 A-G
- 卡组结构：`50` 张主卡组 + `5` 张公共备牌库
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
  - 七名角色的默认卡组配置

### 角色模块

- `src/data/characters/characterA.ts`
- `src/data/characters/characterB.ts`
- `src/data/characters/characterC.ts`
- `src/data/characters/characterD.ts`
- `src/data/characters/characterE.ts`
- `src/data/characters/characterF.ts`
- `src/data/characters/characterG.ts`

每个角色文件独立维护：

- 角色基础资料
- 被动能力
- `jump10 / jump13` 对应的大招配置

### 卡牌模块

- `src/data/cards/minions.ts`
  - 全部使魔定义
  - 公共备牌库终结者从 `src/data/cards/minions/sideboardFinishers.ts` 聚合进来，当前共 5 张。
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
  - 负责费用变动触发盖伏、出牌回合限制、额外回合费用覆盖、无视护卫攻击、抽牌判负和磨牌上限等具体行为。
  - 抽牌判负口径为：只要需要抽牌时牌库为空就败北，不再检查手牌是否为空。
- `slotResolver.ts`
  - 跳脸槽与神抽槽计算、角色大招解析
  - 负责回合结束的自然槽增长上限，默认跳脸最多 +3、神抽最多 +5，并读取天赋与 `逆境神龛`的上限加成。
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
   - 类型检查并通过 Vite 生成可部署的网站产物到 `dist/`
2. `src/main.tsx`
   - 使用 React `createRoot()` 挂载应用
3. `src/App.tsx`
   - 读取 `useGameStore` 状态并渲染界面
4. `useGameStore.ts`
   - 调用 `ShinDoroGame`
5. `ShinDoroGame`
   - 分派到 `phases / effects / slotResolver / rules / ai`

## 测试与构建

- `npm run build`
  - 负责类型检查和 Vite 生产构建，输出到 `dist/`
- `npm test`
  - 会先把规则层编译到 `.test-dist/`，再跑 `tests/engine.test.js`
- 因为测试依赖 `.test-dist/`，只改 `src/` 后应运行 `npm test` 让测试看到最新规则代码。

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

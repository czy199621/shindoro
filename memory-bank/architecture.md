# 架构

## 2026-05-10 构筑器与衍生卡规则层

- 设置页现在按“选择角色 → 选择卡组 → 购买天赋 → 开始对局”的顺序组织玩家开局流程；AI 角色选择仍保留在设置页左侧。
- 卡组构筑器现在是设置页下的独立子画面：`uiState.setup.deckBuilderOpen` 为真时，`GameApp` 渲染专门的 `renderDeckBuilderScreen()`，而不是把构筑器嵌在设置页面板内。
- 本地自定义卡组通过 `localStorage` 保存，键名为 `shindoro.savedDecks.v1`；保存结构为 `SavedDeckCollection`，每个 `SavedDeck` 记录 `id / name / characterId / mainDeck / createdAt / updatedAt`。
- `src/data/deckValidation.ts` 是卡组合法性事实源，负责检查主卡组 50 张、同名最多 3 张、未知卡、公共备牌终结者、衍生卡、`coin` 与已删除的 `great_mana_gem`。
- `src/store/useGameStore.ts` 持有构筑器 UI 状态、读取/保存本地卡组、筛选构筑卡池，并在开始对局前把合法的 `playerMainDeck` 传给引擎。
- `src/engine/gameState.ts` 的 `setupMatch()` 与 `buildPlayer()` 已支持自定义玩家主卡组；引擎会再次调用卡组校验，防止非法卡组绕过 UI。
- 新效果动作 `createCardOnTopDeck` 用于把衍生卡置于己方或对手牌库顶；新效果动作 `scryDeck` 用于观星 / 扰星；新包装动作 `ifOwnGraveyardAtLeast` 用于墓灯系列这类墓地数量条件。
- `src/engine/phases.ts` 会在抽牌阶段正式抽牌前触发 `enemyDrawPhaseStarts` 陷阱，目前由 `错位星盘` 使用。
- 第一批新卡池包括防 mill 备份碎片体系、三叠链备份体 / 回溯体 / 墓灯系列、污染垃圾卡体系，以及观星样例卡；衍生卡通过 `token` 标签从构筑卡池排除。
- 数字版观星当前采用确定性整理：按费用从低到高、同费按卡名排序；这样先保留“只操作牌库顶、不检索整副卡组”的规则边界，后续再决定是否增加玩家选择弹窗。

## 2026-05-01 星空幻想科技 UI 风格层

- 当前 UI 风格事实源为 `design/shindoro_ui_style_spec.md`，目标是深蓝星空、蓝紫发光、金色高光、几何 HUD 和半透明面板。
- 本次风格改造只落在视觉层：`src/style.css` 增加 Shindoro UI Style Spec 覆盖层，不改变 `GameState`、引擎规则、卡牌数据、AI 或出牌结算。
- `public/ui/shindoro-starry-table.svg` 是新的星空魔法阵桌布资源，用于对局桌面 `.arcana-table-art` 和启动页背景氛围。
- `public/ui/shindoro-card-back.svg` 是新的卡背资源，用于敌方手牌伏牌和后场盖伏显示。
- `src/components/react/PlayerHUDView.tsx` 的 `SlotMeter` 增加了槽位徽记和 10 / 13 阈值标记；跳跃槽使用蓝色能量语义，神抽槽使用紫色能量语义。
- 面板、按钮、HUD、弹窗、日志、卡牌详情、战场槽位和卡面都通过统一 token 覆盖成同一套发光边框与深色信息层。
- 规则文档 `design/game_rule.md` 不需要同步修改，因为本次没有改变任何玩法规则；设计文档 `design/game_design.md` 已记录 UI 风格实现基准。

## 2026-04-30 v1.3 规则与内容层

- 当前规则基准升级为 `design/game_rule.md` v1.3，补丁来源为 `design/shindoro_v1_3_patch_summary.md`。
- 硬币系统已从“默认后手补偿”改为天赋投资：`src/data/talents/resource.ts` 的 `tactical_coin` 会在游戏开始时把 1 张 `coin` 放入手牌；`src/engine/gameState.ts` 不再默认给 P2 塞硬币。
- `coin` 仍是法术卡，但效果随回合成长：第 1～3 回合 +1，第 4～6 回合 +2，第 7～8 回合 +3；`src/engine/phases.ts` 会在第 9 回合开始时把未使用的硬币移出游戏。
- `great_mana_gem` 已从 `src/data/cards/spells.ts` 删除，并且不进入任何 v1.3 预组主卡组。
- `src/data/decks.ts` 已按 v1.3 草案重排 7 套 50 张预组；公共备牌仍为 5 张终结者，且不进入主卡组。
- 新增测试使魔 `graveyard_dragger`（坟场拖拽者），用于验证战斗破坏同归于尽亡语。
- 墓地记录在 `src/types.ts` 中扩展为带 `cardId / ownerId / fromZone / reason / turn / wasCombatDestroyed / combatKillerInstanceId` 的结构，便于后续墓地主题卡池读取。
- `src/engine/effects.ts` 现在统一通过墓地记录 helper 处理被使用、破坏、弃置和磨掉的卡牌；战斗破坏会记录破坏者。
- 公共终结者规制已落地：卡奥斯、米迦勒、尤斯蒂娅通过 `skipCombatThisTurn` 表达“重压”，进场后本回合不能继续战斗；瞬和乌洛波洛斯不受该限制。
- 寒尘已按 v1.3 削弱为 10 点磨 6、13 点基础磨 9。

## 2026-04-29 卡牌底框资源
- 战斗界面当前采用无 header 布局：`ReactBattleBoard` 与旧 `Board` 都不再渲染顶部 `game-hero`，`board-shell` 直接占满 `game-shell` 的主视口。
- 战斗 HUD 采用 `board-shell` 角落定位：敌方 HUD 贴近棋盘左上并轻微压住内框，玩家 HUD 位于右下；手牌区是无 `zone` 底框的底部手牌带，并在右侧为玩家 HUD 预留空间。
- 场上区域上限由 `src/engine/rules.ts` 的常量维护：随从 `MAX_MINION_SLOTS = 7`，持续物与陷阱共享后场 `MAX_BACKROW_SLOTS = 7`，并通过 `getBackrowSlotCount()` 统一计算占用；出牌、召唤、AI 和战场计数都应读取这些常量与 helper。
- 战场区 UI 已按 Figma V2 落回 React 代码：`ReactBattleBoard.tsx` 渲染固定槽位，随从行固定 7 格，后场行固定 7 格；玩家持续物与陷阱合并在后场行，敌方陷阱只显示盖伏占位，不泄露卡面信息。
- 敌方手牌现在作为顶部伏牌手牌带显示，只展示卡背和数量；战斗主区域为敌方手牌 / 敌方战场 / 我方战场 / 我方手牌四行结构。因顶部手牌占用纵向空间，双方战场槽位必须保持同一套缩小尺寸，避免敌我战场密度不一致。
- 最新战斗布局按标注图改为三列四行：左列保留敌方 HUD 与敌方后场，中央列依次是敌方手牌、敌方前场、我方前场、我方手牌，右列保留日志入口、我方后场与玩家 HUD。中央 `field-zone` 只展示前场随从槽，左右 `side-backrow-zone` 承载持续物 + 陷阱共享后场 7 格。
- 中央随从槽是视觉映射，不改变规则数组：`player.board` 仍为紧凑顺序，UI 渲染时按 7 格中心优先顺序展示，依次为中央、左一、右一、左二、右二、最左、最右。
- 左右 `side-backrow-zone` 采用紧凑 2x4 矩阵：第一格是阵营计数牌，剩余 7 格是共享后场槽；该结构用于降低后场高度，避免与角落 HUD 互相覆盖。
- 右上 `battle-control-dock` 统一承载战斗日志入口和辅助战斗操作按钮；“重新开始 / 取消攻击选择”竖排放在日志按钮下方，不再占用手牌或后场区域。
- 最新操作区约束：“结束回合”属于手牌区主操作，固定显示在 `.hand-zone` 顶部居中、手牌行正上方；不要再挂回我方 `side-backrow-zone` footer。
- 敌方 `side-backrow-zone` 的左边缘应跟敌方 HUD 左边缘对齐，保持左侧战斗信息的统一视觉基准。
- 为保证上述对齐，敌方 `side-backrow-zone` 直接渲染在 `.enemy-hud-corner` 内，位于敌方 HUD 下方；不要再依赖 `battle-main` 的 `enemySide` 网格列或桌面端绝对定位来对齐敌方后场。
- 手牌区最后由 `.hand-zone` / `.hand-row` 兜底规则保证完整可见：底部手牌行高度必须匹配图片式卡框比例，右侧通过 HUD 安全区避开玩家面板，矮屏桌面端优先缩小手牌卡而不是裁掉卡面。
- `EffectLayer` 与 `turn-seal` 必须保持为 `board-shell` 内的绝对定位浮层；召唤、放置、法术等 `cardFx` 出现时不能让这些节点成为 flex 普通子项，否则会挤压 `battle-layout`。
- 当前战场外框为透明化处理：敌我 `field-zone` 不显示底框；空随从槽与空后场槽不显示边框、编号和标签，只有被卡牌占用后才显现槽位视觉。
- 敌方手牌只显示放大的伏牌卡背，不显示“敌方手牌”标题和数量牌；尺寸应尽量接近我方手牌卡尺寸。
- 势能信息由玩家 HUD 承载：`getAdvantageBreakdown()` 的总分与手/血/威/特分项传入 `PlayerHUD` / `renderPlayerHUD`，不再渲染常驻 `MomentumPanel` 侧栏。
- 战斗日志由右侧 `details.battle-log-drawer` 折叠展示，默认收起；展开时作为悬浮层覆盖在战场右侧，不再占用固定侧栏宽度。
- `public/card-frames/common/frame.png` 是当前第一版通用卡牌底框，尺寸为 `720 x 1040` 透明 PNG。
- `public/card-frames/minion/frame.png`、`spell/frame.png`、`persistent/frame.png`、`trap/frame.png` 暂时复制同一张底框，保证所有卡牌类型都有一致的可见框架。
- `frame.png` 只承载底框、美术窗、费用托座和属性托盘等静态视觉，不烘焙卡名、效果文本或数值；费用、攻、防、威胁仍由 UI 层渲染。
- `src/style.css` 的末尾覆盖规则负责把卡牌背景透明化、铺满 `card-frame-base`，并把费用、卡图、三属性锚定到这张底框的预留位置。
- 当前卡牌根节点统一带 `framed-card` 类，根节点本身直接使用 `frame.png` 作为背景图；旧的 `card-frame-layers` 保留为兼容结构但不再承担可见底框。
- 卡牌正面的数值徽章使用图标加数字：剑表示攻击，盾表示防御，闪电表示威胁；图标目前在 `src/style.css` 中以 CSS 形状绘制。
- 后续要做类型差异化时，直接替换对应 `public/card-frames/<type>/frame.png` 即可，不需要改组件结构。

## 2026-04-28 原创二次元商业卡牌 UI 层

- 视觉资产：
  - `public/ui/moe-arcana-table.svg` 是战斗桌面的原创 SVG 背景，由 `src/style.css` 的 `.arcana-table-art` 引用。
  - `public/ui/card-art-minion.svg`、`card-art-spell.svg`、`card-art-persistent.svg`、`card-art-trap.svg` 是当前卡牌插画占位资产。
  - `public/card-frames/` 是图片式卡牌框架资源根目录，按 `common / minion / spell / persistent / trap` 分层存放卡框、卡图窗、标题牌、文本框、费用宝石和属性徽章图片。
  - `public/characters/<character_id>/card.jpg` 和 `avatar.jpg` 是角色图片默认约定路径，由 `src/data/characterArt.ts` 生成并提供给设置页角色卡与对局 HUD。
  - 这些资产只承担 UI 美术表现，不参与规则、数据或 AI 判定。
- 卡牌框架图片层：
  - `src/components/react/CardView.tsx` 会在卡牌根节点内渲染 `card-frame-layers`。
  - `src/style.css` 通过 `--card-frame-*` 变量按卡牌类型选择图片资源；类型专属资源优先，缺省时可回退到 `public/card-frames/common/`。
  - 当前 `public/card-frames/` 内放有透明 PNG 占位，后续设计正式卡框时直接替换同名文件即可。
- 极简卡面口径：
  - 卡牌正面只显示费用、攻、防、威胁；卡名、类型、关键词、简介、效果和状态提示不再显示在卡面上。
  - React 卡牌的完整说明继续走统一悬停 / 聚焦详情；旧字符串模板卡牌通过 `title` / `aria-label` 保留基础悬停说明。
  - 缺失的攻、防、威胁值显示为 `-`，确保法术、持续物和陷阱也能保持稳定卡面布局。
- React 战斗界面：
  - `src/components/react/ReactBattleBoard.tsx` 负责挂载 Moe Arcana 战斗桌图层、中央回合纹章、品牌锁定区、战斗状态、操作按钮和弹窗。
  - `src/components/react/CardView.tsx` 现在包含 `CardArt` 插画窗，并通过 `fanIndex / fanCount` 给手牌提供扇形排列参数。
  - `src/components/react/PlayerHUDView.tsx` 现在包含 `hud-avatar` 角色头像图片槽，角色状态仍只读取 `PlayerState` 和 `CharacterDefinition`。
- 角色美术配置：
  - `src/types.ts` 的 `CharacterDefinition.art` 支持 `card / avatar / banner / alt`。
  - `src/data/characterArt.ts` 的 `createCharacterArt()` 用于给角色数据生成默认图片路径；`getCharacterArt()` 用于 UI 读取最终路径。
  - 现有角色数据文件都已接入默认路径，后续新增角色时应同步配置 `art: createCharacterArt("<character_id>", "<角色名>角色卡图")`。
- 样式边界：
  - `src/style.css` 承担这次商业卡牌桌面视觉层，包括星光背景、桌面 SVG 叠层、玻璃战区、费用宝石、卡框高光、卡面扫光、手牌悬停放大、目标脉冲和 HUD 高光。
  - `src/style.css` 同时承担当前 UI 的响应式边界护栏：战斗画面在 `.game-shell` 内裁切装饰层、约束卡牌宽度并使用内部横向滚动；设置页和换牌页约束标题、信息格、按钮行和选择卡，避免窄屏右侧越界。
  - 战斗画面底部手牌区是保留高度区域，`.battle-main` 的第三行、`.hand-zone` 与 `.hand-row` 都需要优先保证手牌卡完整可见；矮屏时应压缩卡牌内容和顶部状态条，而不是裁掉手牌。
  - 新增视觉层不改变 `GameState`、引擎规则或 store API；规则仍由 `src/engine/` 和 `src/store/useGameStore.ts` 驱动。
  - `dist/` 是 Vite 构建产物，源码 UI 改动后需要通过 `npm.cmd run build` 同步。

## 2026-04-24 桌面战斗布局

- `src/components/Board.tsx`
  - 战斗画面改为上下两个战场区加紧凑手牌区，桌面端可以把更多宽度留给棋盘，而不是把所有内容纵向堆叠。
  - 对局标题栏把左侧标题/状态与中间战斗信息分开，让回合和阶段信息位于宽屏视觉中心。
  - 当前战斗日志已从固定右侧栏改为右侧折叠抽屉；势能信息并入玩家 HUD。
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
  - 已移除。势能展示改由 `PlayerHUD.tsx` 与 `PlayerHUDView.tsx` 承担。

## 2026-04-25 React 战斗面板与 Pixi 特效

- 战斗画面渲染：
  - `src/components/react/ReactBattleBoard.tsx` 是 `state.screen === "game"` 时的实际战斗画面渲染器。
  - 设置页和换牌页仍通过 `src/App.tsx` 使用旧字符串模板兼容路径。
  - 战斗画面由真实 React 组件组合卡牌、玩家状态、战场区域、按钮、弹窗、折叠战斗日志和 HUD 内势能展示。
- React 组件职责：
  - `src/components/react/CardView.tsx` 负责手牌、场上使魔、持续卡、盖伏卡、关键词徽章、属性徽章、可用状态和卡牌检视数据。
  - `src/components/react/PlayerHUDView.tsx` 负责角色/玩家状态展示，包括生命、法力、手牌/牌库数量、势能摘要、跳脸槽、神抽槽和槽位就绪说明。
  - `src/components/react/ReactBattleBoard.tsx` 负责战斗画面组合、玩家操作、待处理选择弹窗、游戏结束弹窗、效果横幅、折叠战斗日志和卡牌详情提示。
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
  - 战斗界面没有顶部 header，棋盘直接占满主视口。
  - 主战斗画面使用稳定的视口行，分别承载敌方场面、玩家场面和玩家手牌。
  - 行动日志默认收起为右侧抽屉入口，展开时覆盖在战场右侧查看。
  - 卡牌、使魔、持续物、玩家状态、HUD 势能和日志抽屉都使用更严格的高度限制和内部滚动，避免长文本撑开棋盘。
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
- 规则基准：`design/game_rule.md` v1.3
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
  - 大奶的槽位耗散只扣 1 到 9 点的未就绪槽位；10 / 13 点已就绪槽位会先进入大招处理，避免在宣告前被自身被动扣掉。
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

- `src/components/html.ts`
  - 只保留设置页所需的安全 HTML 辅助函数。
- `src/components/react/ReactBattleBoard.tsx`
  - 当前唯一活跃的对战画面渲染器，负责战斗桌、换牌手牌、前场、左右后场、日志抽屉、操作按钮和待处理选择弹窗。
- `src/components/react/CardView.tsx`
  - 负责手牌卡、场上使魔、持续物和陷阱的图片式卡框、美术窗、数值与悬停详情。
- `src/components/react/PlayerHUDView.tsx`
  - 负责角落玩家 HUD、生命、法力、势能摘要、手牌/牌库与槽位状态。
- `src/game-view/pixi/PixiBattlefieldHost.tsx`
  - 只负责非交互战斗特效，不参与规则判定。

旧的字符串战斗组件 `Board.tsx / Card.tsx / EffectLayer.tsx / PlayerHUD.tsx / ResolutionPanel.tsx / SlotMeter.tsx` 已移除；不要再把新战斗 UI 写回旧模板栈。

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

## 2026-04-29 Card JPG Art Pipeline

- Card definitions now support an optional `art` string. `src/data/cardArt.ts` resolves the default image path as `/cards/<card-id>.jpg`.
- `src/data/cards.ts` exports card lists and `CARD_LIBRARY` with art paths attached, so `getCardDefinition()` returns cards that already know their illustration path.
- Runtime hand cards inherit `art` through `createRuntimeCard()`. Board instances inherit it through `createMinionInstance()` and `createPersistentInstance()`.
- React card rendering passes `art` into `.card-art.has-card-art` using `--card-art-image`.
- Static card art files live in `public/cards/`; Vite copies them to `dist/cards/` during build.
- `scripts/generate-card-art.ps1` generates simple effect-readable anime-style JPG defaults from the TypeScript card data. Replace any generated JPG with a polished hand-made image using the same card id filename.

## 2026-04-29 Non-Minion Card Frames

- Spell, persistent, and trap cards use separate bitmap frame assets in `public/card-frames/<type>/frame.png`.
- `scripts/generate-card-frames.ps1` regenerates these non-minion frames. They remain PNG rather than JPG so rounded transparent corners are preserved.
- Non-minion hand cards no longer render the attack / defense / threat row. Board persistent/trap cards also omit the stat row.
- CSS gives non-minion framed cards a larger illustration window because there is no bottom stat strip.
- Non-minion frame URLs include a version query in the final CSS override to avoid stale browser caches after regenerating `frame.png`.

## 2026-04-29 In-Battle Mulligan Flow

- `setupMatch()` still enters `screen: "mulligan"` and the engine keeps `completePlayerMulligan()` as the transition into the first real turn.
- During `mulligan`, `App.tsx` now renders the battle scene instead of the old standalone mulligan screen, so the player sees the main board immediately.
- `ReactBattleBoard` now handles mulligan directly in the bottom hand zone. The player clicks hand cards to mark them, then clicks the always-available `更换手牌` button.
- Selecting zero cards and clicking `更换手牌` keeps the current opening hand and starts the game.
- `useGameStore` only tracks `uiState.mulliganSelection`; the old `"ask" | "select"` mulligan mode has been removed.
- Battle hand cards are forced opaque in CSS even when they are disabled during non-main-turn states.
- Mulligan card selection uses `HandCard.onSelect`, separate from normal card play, so selecting opening cards is not blocked by playability checks.
- The old standalone mulligan framework has been removed from active source and build output: no `renderMulliganScreen`, no `renderMulliganCard`, no `onMulliganAction`, no `toggle-mulligan`, and no `.mulligan-grid` CSS remain.
- The old overlay mulligan framework has also been removed from active source and build output: no `MulliganOverlay`, `mulligan-overlay`, `mulligan-modal`, or `mulligan-card-row` remain.

## 2026-04-29 Global Code Audit And Legacy Renderer Cleanup

- Active runtime entry is `src/main.tsx` -> `src/App.tsx`.
- `src/App.tsx` still owns the setup screen through the legacy HTML template path, but `screen: "mulligan"` and `screen: "game"` both render through `src/components/react/ReactBattleBoard.tsx`.
- The active battle UI component set is `ReactBattleBoard.tsx`, `CardView.tsx`, and `PlayerHUDView.tsx`, with visual effects delegated to `src/game-view/pixi/PixiBattlefieldHost.tsx`.
- The old string-rendered battle stack has been removed from source: `src/components/Board.tsx`, `Card.tsx`, `EffectLayer.tsx`, `PlayerHUD.tsx`, `ResolutionPanel.tsx`, `SlotMeter.tsx`, and the already-removed `MomentumPanel.tsx`.
- The old `data-action` battle click protocol in `App.tsx` was removed. Legacy click handling now only routes setup-screen actions through `onSetupAction()`.
- A local import graph check found no source files unreachable from `src/main.tsx` after this cleanup.
- `npm.cmd run typecheck -- --noUnusedLocals --noUnusedParameters`, `npm.cmd run build`, and `npm.cmd run test` all pass after the cleanup.
- Known technical debt: `src/style.css` is still very large and contains many late UI overrides from iterative layout work. It should be split into focused files or layers before the next major UI pass.
- Known technical debt: `ReactBattleBoard.tsx` is large but still cohesive as the current battle surface. Good future split points are hand/mulligan hand, side backrow lanes, battlefield lanes, and battle log/control dock.
- Known technical debt: setup remains the last legacy string-template island. It is active, not dead, but can later be migrated to React to remove `dangerouslySetInnerHTML` from `App.tsx`.

## 2026-05-01 PNG Card Frame Layer

- Card-frame image assets now standardize on PNG only. PNG is required because the frame layer has transparent rounded corners and overlays the card illustration; JPG would flatten the transparent areas.
- The active frame files are `public/card-frames/common/frame.png`, `minion/frame.png`, `spell/frame.png`, `persistent/frame.png`, and `trap/frame.png`.
- `src/style.css` applies these files through `--card-frame-base` and final cache-busted URLs using `?v=shindoro-frame-20260501`.
- The bitmap frame is the primary visual shell; CSS remains responsible for cost/stat badges, readable labels, hover/detail behavior, and fallback gradients.

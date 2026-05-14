# 《神どろ》游戏设计文档 (GDD)
## 基于《核心规则与设计案 v1.3》的数字实现设计

---

## 零、文档定位

### 0.1 文档关系

- `design/game_rule.md` 是**规则事实源**。
- 本文档是**数字版实现设计**，负责把规则文档转换成可开发、可拆分、可验证的系统方案。
- 若本文档与 `design/game_rule.md` 冲突，以 `design/game_rule.md` 为准。

### 0.2 目标

在当前仓库已有原型的基础上，将《神どろ》从“3 角色、30 张预组牌、原型级简化规则”升级为与 v1.3 规则一致的数字版对战原型。

### 0.3 设计原则

1. **规则优先**：实现应尽量贴近 v1.3 规则，而不是延续旧原型的简化口径。
2. **模块化演进**：继续保留当前仓库的 `data / engine / store / components` 分层，不把规则扩张堆进单一文件。
3. **可解释性优先**：双槽、势能差、角色被动、天赋定价都必须能在 UI 和日志中解释清楚。
4. **渐进式升级**：先完成规则骨架与数据模型升级，再逐步补齐关键词、角色、卡池与 UI 细节。

### 0.4 UI 风格实现基准

当前 UI 美术包装以 `design/shindoro_ui_style_spec.md` 为基准，目标是“星空幻想科技卡牌界面”：

- 主色调采用深蓝、靛蓝、紫蓝与金色高光。
- 全局背景使用星空、魔法阵、几何 HUD 与半透明发光面板。
- 主按钮使用金色浮雕风格，次按钮使用深蓝底与蓝紫描边。
- 对局内双槽系统是核心视觉组件：跳跃槽偏蓝色，神抽槽偏紫色，并显示 10 / 13 点阈值。
- 卡牌、HUD、弹窗、日志、设置页基础面板统一走同一套发光边框与深色信息层。
- 本风格层只改变视觉与交互反馈，不改变规则、卡牌数据、AI 行为或结算流程。

---

## 一、v1.3 规则下的目标产品定义

### 1.1 对战形式

- 基础目标仍以数字原型为主，可先保留 `玩家 vs AI`。
- 规则层不应写死“只支持当前 3 角色原型”，而应面向 v1.3 的完整角色与内容结构设计。

### 1.2 核心玩法

围绕以下三层循环展开：

1. **赛前决策**
   - 选择角色
   - 根据先后手购买动态定价天赋
   - 装载角色对应主卡组与备牌库
2. **回合对战**
   - 回合开始阶段
   - 摸牌阶段
   - 主要阶段
   - 战斗阶段
   - 回合结束阶段
3. **势能与爆发**
   - 回合结束计算总势能差 `V`
   - 优势方累积跳脸槽
   - 劣势方累积神抽槽
   - 在回合开始阶段处理 10 / 13 点爆发

### 1.3 目标版本与当前原型的本质差异

相较于当前仓库中的原型，实现目标发生了以下升级：

- 从 **30 张固定预组牌** 升级到 **50 张主卡组规则**
- 从 **3 名角色** 升级到 **7 名已接入角色**
- 从 **固定价格天赋** 升级到 **按先后手动态定价**
- 从 **简化阶段流** 升级到 **明确分开的五段回合流**
- 从 **少量原型关键词** 升级到 **一套带系统联动的使魔关键词体系**

---

## 二、系统范围定义

### 2.1 本阶段必须覆盖的系统

- 角色系统
- 动态定价天赋系统
- 主卡组 / 备牌库系统
- 回合阶段系统
- 使魔、魔法、持续魔法、触发魔法
- 势能计算与双槽系统
- 角色专属 10 / 13 点跳脸效果
- AI 对手的基础行动逻辑
- 势能说明、槽位说明、日志反馈

### 2.2 可以分阶段补完的系统

- 全量关键词的完整动画表现
- 更复杂的 AI 策略
- 更完整的卡组分享、导入导出与线上同步
- 更丰富的卡池与数值平衡
- PvP / 联机模式

---

## 三、规则到系统的映射

### 3.0 公共终极备牌库与大魔法更新

本次更新将 `design/update.md` 中的公共备牌库终结者与大魔法系列纳入数字版实现目标。

数据层约定：

- 公共终结者作为使魔卡维护在 `src/data/cards/minions/sideboardFinishers.ts`。
- 大魔法作为法术卡维护在 `src/data/cards/spells.ts`。
- 每名角色的 `sideboard` 当前统一接入 5 张公共终结者：乌洛波洛斯、米迦勒、卡奥斯、瞬、尤斯蒂娅。

引擎层新增能力：

- 额外回合、额外回合失败败北，以及指定额外回合的 12 点费用覆盖。
- 全场魔法卡移除与全场使魔肃清。
- 将敌方卡组磨到指定剩余数量，并支持“最多磨固定张数”的限制。
- 双方当前生命值互换。
- 在指定使魔存活期间封锁双方跳脸与神抽发动。
- 全场或单向清场、持续魔法拆除、触发魔法拆除。
- 对方下回合费用点减半。
- 第 5 回合后才能打出的卡牌限制。
- 费用达到指定数值时触发的盖伏检测。
- 单个使魔攻击时无视护卫的战斗指定规则。

UI 层需要解释：

- 公共终结者是 13 点神抽槽的主要高风险目标。
- 清场和支援区拆除会立即改变威胁分。
- 卡奥斯会把对手推向牌库危机，但最多只会一次磨 15 张，避免从高牌库数量直接压到死线。
- 瞬可以绕过护卫直接攻击角色或指定关键使魔，是公开大地牌库里的斩杀压力点。
- 尤斯蒂娅在场时，双槽即使到达阈值也不会发动。

### 3.1 基础数值与构筑

根据 `design/game_rule.md`，系统应支持：

- 角色基础生命值：20
- 主卡组规则：50 张
- 同名卡规则：最多 3 张
- 备牌库：独立于主卡组，用于 13 点神抽槽

数字实现要求：

- `src/data/decks.ts` 不能继续只承载 30 张原型预组，而要改成面向 50 张规则的数据结构。
- 需要在装载对局时校验卡组长度与同名卡上限。
- 备牌库不能再仅被视为固定小型公共卡列表，而应具备规则层的独立身份。

### 3.2 回合阶段系统

v1.3 明确要求：

1. 回合开始阶段
2. 摸牌阶段
3. 主要阶段
4. 战斗阶段
5. 回合结束阶段

数字实现要求：

- `GamePhase` 需要拆分为更明确的阶段，而不是只停留在 `turnStart / slotResolution / mainTurn`。
- 槽位处理应发生在回合开始阶段。
- 摸牌必须成为独立阶段。
- 战斗阶段与主要阶段至少在逻辑上分离，即使 UI 上仍保持连续交互。

### 3.3 使魔关键词系统

v1.3 关键词分为两层：

- 基础战斗词条：护卫、疾风、连击、回复、魔抗
- 高阶联动词条：吸血、潜行、威压、死斗/必杀、遗言、共鸣、看破

数字实现要求：

- `tags` 不能只服务于当前的 `rush`，需要升级为更可扩展的关键词体系。
- 部分关键词需要规则层支持：
  - 护卫：改变攻击目标合法性
  - 连击：改变每回合攻击次数
  - 回复：回合内自动恢复
  - 魔抗：改变法术/效果目标选择
  - 吸血：伤害后转治疗
  - 潜行：限制可被指定与攻击
  - 威压：影响威胁值计算
  - 必杀：影响战斗后存活判定
  - 共鸣：依赖槽位数值
  - 看破：影响陷阱信息与触发规则

### 3.4 势能与双槽系统

规则明确了：

- `V = 手牌差分 + 血量差分 + 威胁值差分 + 特殊状态扣分`
- 优势方获得跳脸槽
- 劣势方获得神抽槽
- 10 点触发可选效果
- 13 点触发强制 Overkill 效果

数字实现要求：

- `rules.ts` 负责计算 `V` 和可解释的明细。
- `slotResolver.ts` 负责槽位累积、10 / 13 点处理、角色修正与神抽选牌。
- `GameState` 需要保存最近一次结算的明细，供 UI 展示。
- UI 必须显示：
  - 当前数值
  - 下一阈值
  - 本回合增量原因
  - 即将触发的效果

### 3.5 动态定价天赋系统

v1.3 天赋不再是单一固定费用，而是：

- 同一条天赋在先手 / 后手价格不同
- 还存在先后手限定天赋

数字实现要求：

- `TalentDefinition` 需要从单个 `cost` 升级为更清晰的定价结构，例如：
  - `firstCost`
  - `secondCost`
  - `availableFor`
- 赛前界面必须根据玩家当前身份展示正确价格。
- AI 选天赋时也需要按自身先后手身份计算。

### 3.6 角色系统

v1.3 当前数字版角色为 A–G 七名：

- A：钱陈飞扬
- B：Kapipara
- C：大奶
- D：孔德人
- E：ggy
- F：寒尘
- G：泉亚猫

数字实现要求：

- `src/data/characters.ts` 需要从 3 角色扩展为 7 角色。
- 角色被动不再只覆盖当前三种 `PassiveKey`。
- 角色跳脸技能需要覆盖 10 点与 13 点两档。
- 大奶的 `槽位耗散` 只扣未到 10 点的槽位；已经达到 10 / 13 点的槽位必须先进入大招宣告队列，避免玩家攒满后在发动前被自身被动扣没。
- 若某些角色技能涉及当前引擎没有的动作类型，需要扩展 `EffectAction`。

### 3.7 泉亚猫与大后期 / 破坏流更新

泉亚猫更新把“手牌破坏”和“爆牌惩罚”做成可实装系统：

- 新角色 `character_g` 维护在 `src/data/characters/characterG.ts`。
- 泉亚猫的 3 套 starter 预设维护在 `src/data/decks.ts`，分别偏向空白污染、污染压缩和观星控制。
- `jump10` 使用随机弃牌；当对方手牌不足时改为生命损失。
- `jump13` 使用最高费用优先弃牌，模拟“精准挑选 2 张”的数字版执行。
- 新天赋分布在 `resource / deckControl / survival` 三类：
  - `mana_breakthrough`：最大费用上限 11。
  - `abyssal_mana`：最大费用上限 12。
  - `mental_pollution`：自身爆牌时对方随机弃牌。
  - `void_backflow`：自身爆牌时磨对方牌库。
  - `grace_surge`：恢复效果额外 +1。

引擎层对应新增：

- `discardWithEmptyHandDamage` 用于泉亚猫大招。
- `setManaCap`、`overflowOpponentDiscard`、`overflowOpponentMill`、`increaseHealingReceived` 用于新天赋。
- 手牌上限溢出烧牌时，会触发爆牌联动。
- 所有通过通用恢复动作和当前阶段被动产生的恢复量，会读取恢复加成。

---

## 四、数据模型升级建议

### 4.1 角色

角色数据至少应包含：

- id
- name
- title
- baseHp
- talentPoints
- passive
- jump10
- jump13
- 预组牌库或牌池绑定

当前 `CharacterDefinition` 可以继续作为基础，但需要扩充被动类型与技能表达能力。

### 4.2 天赋

建议把天赋定义改成如下方向：

```ts
interface TalentPricing {
  firstCost?: number;
  secondCost?: number;
}

interface TalentDefinition {
  id: string;
  name: string;
  description: string;
  pricing: TalentPricing;
  availability?: "both" | "firstOnly" | "secondOnly";
  repeatLimit: number;
  effect: TalentEffect;
}
```

### 4.3 卡组与备牌

建议把卡组配置升级为：

```ts
interface DeckConfig {
  mainDeck: string[];
  sideboard: string[];
}
```

当前数字版额外使用：

```ts
interface StarterDeckPreset {
  id: string;
  characterId: string;
  name: string;
  difficulty: 1 | 2 | 3;
  speed: "快" | "中快" | "中速" | "中慢" | "慢";
  tags: string[];
  recommendedTalents: string[];
  description: string;
  keyCards: string[];
  mainDeck: string[];
}
```

即使短期内仍共用部分备牌，也不应把备牌系统继续写死成单个全局常量。

### 4.4 阶段与日志

建议把 `GamePhase` 扩为：

```ts
type GamePhase =
  | "setup"
  | "mulligan"
  | "turnStart"
  | "draw"
  | "slotResolution"
  | "mainTurn"
  | "combat"
  | "turnEnd"
  | "gameOver";
```

日志层需要能明确标记：

- 回合开始事件
- 抽牌阶段事件
- 牌库为空时仍需要抽牌的败北事件；该败北不检查手牌数量
- 槽位触发事件
- 战斗事件
- 势能计算明细

---

## 五、当前仓库下的实现架构建议

### 5.1 延续现有分层

继续使用当前仓库已经成型的分层：

- `src/data/`：角色、卡牌、天赋、卡组
- `src/engine/`：规则、阶段、效果、双槽、AI
- `src/store/`：UI 编排与用户选择状态
- `src/components/`：HTML 字符串渲染与面板展示

### 5.2 不做的架构性跳跃

本阶段不建议：

- 把项目重构成新的 React 状态架构
- 引入大型后端
- 推翻现有字符串渲染方案

本阶段目标是**升级规则实现能力**，不是替换整套前端基础设施。

### 5.3 模块责任建议

- `src/types.ts`
  - 先补齐规则需要的结构变化
- `src/data/characters.ts`
  - 扩展到 6 角色
- `src/data/talents.ts`
  - 升级动态定价与限定条件
- `src/data/decks.ts`
  - 升级主卡组 / 备牌库结构
- `src/data/cards.ts`
  - 增补关键词与卡牌效果所需数据
- `src/engine/rules.ts`
  - 维护威胁值、势能差、目标合法性等通用规则
- `src/engine/phases.ts`
  - 负责完整五段回合流
- `src/engine/effects.ts`
  - 负责效果动作与关键词行为
- `src/engine/slotResolver.ts`
  - 负责双槽、神抽、角色爆发
- `src/engine/ai.ts`
  - 负责天赋选择、行动评分与爆发时机
- `src/components/`
  - 负责把新增规则状态透明展示给玩家

---

## 六、UI / UX 目标

### 6.1 必须解释清楚的内容

- 当前是谁优势 / 劣势
- 为什么本回合获得了这些槽位
- 10 点和 13 点分别会触发什么
- 哪些关键词正在影响战场合法性

### 6.2 UI 最低要求

- 角色信息区显示：
  - 生命
  - 法力
  - 跳脸槽
  - 神抽槽
  - 角色被动摘要
- 战场区显示：
  - 使魔攻击 / 血量 / 威胁值
  - 关键关键词
  - 使魔当前数量与 7 个上限；持续魔法和触发魔法共用后场，显示后场当前数量与 7 张上限
- 结算区显示：
  - 势能差明细
  - 槽位变化
  - 待处理选择（10 点 / 13 点）

### 6.3 赛前界面最低要求

- 显示角色可用天赋点
- 显示每条天赋的先后手价格
- 明确显示限定天赋是否可购买
- 实时显示剩余点数

### 6.4 对局亲和化补充

- 对局顶部必须把内部阶段名翻译成中文阶段名，避免玩家看到 `mainTurn`、`combat` 这类程序字段。
- 对局顶部需要提供“当前建议”状态，告诉玩家现在是出牌、攻击、等待 AI、处理弹窗还是结束回合。
- 手牌必须展示可用状态；当卡牌不能打出时，需要说明是费用不足、战场已满、未到指定回合、等待 AI，还是处于非出牌阶段。
- 跳脸槽和神抽槽必须同时显示数值和文字说明：未到 10 点时显示还差几点，到 10 点时显示可发动，到 13 点时显示已满。
- 空战场、空手牌、无持续物、无盖伏时，界面应使用温和的状态说明，让玩家知道该区域之后会放什么。
- 卡牌详情中的关键词、目标、触发条件和效果说明必须尽量使用中文规则语言，不直接暴露程序内部字段。

---

## 七、平衡与验证重点

### 7.1 平衡关注点

- 动态天赋定价是否真的缓和先后手差距
- 50 张主卡组是否会降低原型对局节奏，需要额外补偿抽牌或检索
- 6 角色是否会显著拉高实现复杂度，是否需要分批接入
- 高阶关键词是否会让现有效果系统过于膨胀

### 7.2 验证重点

1. 回合阶段拆分后，槽位触发与抽牌顺序是否始终正确
2. 动态定价天赋是否在 UI、AI 和规则层保持一致
3. 势能差说明是否足够清晰
4. 新关键词是否破坏现有战斗与陷阱逻辑
5. A–G 七名角色的被动和跳脸技能是否都能用统一系统表达

---

## 八、建议实施顺序

### 阶段 1：规则骨架升级

- 升级 `types.ts`
- 升级 `phases.ts`
- 升级 `slotResolver.ts`
- 升级势能结算与日志说明

### 阶段 2：数据层升级

- 扩展角色到 A–G
- 升级天赋数据到动态定价
- 升级卡组配置到 50 张主卡组规则
- 补足新角色与新规则需要的数据字段

### 阶段 3：关键词与效果层升级

- 实装护卫、连击、回复、魔抗等基础关键词
- 再逐步补齐吸血、潜行、威压、必杀、共鸣、看破

### 阶段 4：UI 与 AI 同步

- 赛前天赋价格展示
- 势能差说明面板
- 新角色展示
- AI 天赋与行动逻辑升级

### 阶段 5：平衡与补测

- 补角色测试
- 补槽位与阶段测试
- 补关键词测试
- 调整数值与日志表现

---

## 九、本文档相对旧版的关键修正

- 以 `design/game_rule.md v1.3` 为基准，不再沿用旧版 v1.0 / v1.1 / v1.2 口径
- 删除与现规则冲突的“3 角色 + 30 张预组 + 固定价格天赋”中心假设
- 不再推荐与当前仓库无关的 `React + Zustand + Vite` 作为默认技术方向
- 把设计重点改为“在当前仓库架构上升级规则实现能力”
- 把角色、天赋、卡组、阶段、关键词都升级到 v1.3 视角

---

**© 2026 神どろ (Shin Doro) | 游戏设计文档 v1.3**

---

## 2026-04-29 Implementation Cleanup Design Notes

- Battle screen design is now React-only. The former string-rendered battle UI was removed so there is one active battle rendering path.
- Current battle UI ownership:
  - `src/components/react/ReactBattleBoard.tsx` owns the battle surface, mulligan hand selection, battlefield lanes, side backrow lanes, battle log drawer, and controls.
  - `src/components/react/CardView.tsx` owns card art, frame selection, and visible card stats.
  - `src/components/react/PlayerHUDView.tsx` owns corner character HUDs and momentum/slot summary information.
- Opening hand replacement design: the player stays on the battle mat, clicks cards directly in the bottom hand row to mark replacements, then clicks `更换手牌`. Selecting zero cards and clicking the same button means "keep hand and start".
- Removed design paths: the standalone mulligan page, modal mulligan card row, and string-rendered battle components are no longer part of the product design.
- Remaining design-system debt: the battle surface CSS is visually functional but too centralized. A future polish pass should split the CSS by card frame, battle board, side backrow, hand row, HUD, and log/control dock.
- No gameplay rule changes were made in this cleanup pass.

## 2026-05-01 Card Frame Visual Direction

- Card frames use PNG as the single image format. This preserves transparent edges and lets the frame sit cleanly above any card illustration.
- The shared frame language is dark star-tech fantasy: deep navy base, cyan luminous border, restrained gold accents, and gem-like sockets.
- Minion cards keep the bottom stat area for attack, defense, and threat; spell, persistent, and trap frames keep the same family style but reserve more space for art and do not require stat sockets.
- New frame variants should replace the existing files under `public/card-frames/<type>/frame.png` with the same dimensions and transparent canvas.

## 2026-05-10 构筑器、衍生链与观星第一批落地

- 卡组构筑第一阶段已接入设置页：玩家选择角色后，可以选择角色 starter 预设或本机保存的自定义卡组，再购买天赋并开始对局。
- 构筑器本体采用独立子画面承载，设置页只保留卡组选择与入口，避免构筑信息密度干扰角色和天赋选择。
- 自定义卡组保存使用 `localStorage`，保存键为 `shindoro.savedDecks.v1`；数据结构为 `version: 1` 加多组 `SavedDeck`。
- `src/data/deckValidation.ts` 是构筑合法性检查入口，负责校验 50 张主卡组、同名最多 3 张、未知卡牌、公共备牌终结者、衍生卡、硬币和已删除的大魔力宝石。
- 设置页构筑器支持从当前 starter 预设创建、复制、删除、重命名、保存、筛选、搜索、查看详情、加入和移除卡牌。
- 对局创建时，`ShinDoroGame.setupMatch()` 可以接收 `playerMainDeck` 与 `playerDeckName`；引擎仍会在装载前再次校验卡组，避免 UI 漏检。
- 墓地与衍生卡规则进入第一批可玩内容：防 mill 备份碎片体系、三叠链的备份体 / 回溯体 / 墓灯系列、污染垃圾卡体系已经加入卡池。
- 新效果动作 `createCardOnTopDeck` 负责把新生成的衍生卡放到己方或对手牌库顶；衍生使魔进入墓地后照常参与墓地数量统计。
- 新效果动作 `scryDeck` 负责观星 / 扰星。当前数字版采用费用从低到高的确定性整理，避免在第一阶段引入额外选择弹窗。
- `错位星盘` 使用新的 `enemyDrawPhaseStarts` 触发条件，会在对手抽牌阶段开始、正式抽牌前触发扰星。
- 普通卡牌仍不能从整副牌库检索指定卡牌；直接选择牌库中指定牌的能力继续由神抽槽独占。

## 2026-05-13 additional update 落地记录

- `src/data/decks.ts` 新增 `StarterDeckPreset` 数据结构：每名角色 3 套 starter preset，共 21 套；每套都包含展示名、难度、速度、标签、推荐天赋、简介、关键卡和完整 50 张主卡组。
- 设置页卡组选择改为先展示当前角色的三套 starter preset，再展示本机自定义卡组；从预设创建卡组会复制当前选中预设。
- 构筑器保存、删除、复制、使用卡组、进入构筑器等动作接入全局 Toast 反馈；保存按钮具备保存中状态，并会在保存前执行卡组合法性校验。
- 平衡调整：`法术专注`从法术伤害 +2 改为 +1；钱陈飞扬 `定点爆破` 从 6 伤改为 5 伤，`极限爆破` 从 9 伤改为 7 伤。
- AI 人设与世界观补充暂不作为规则事实源，后续若落地，应进入独立叙事文档或角色资料扩展，而不是改变 `game_rule.md` 的规则口径。

## v1.3 实战平衡性大修设计落地记录

本次更新将 `design/shindoro_v1_3_patch_summary.md` 的必改项和公共终结者测试口径并入当前数字版设计：

- 术语统一：`rush` 的中文展示统一为“疾风”，不再写作“冲锋”。
- 硬币系统重做：默认后手不再自动获得硬币；`战术硬币` 成为可购买天赋，先手 4 点、后手 1 点，开局将 1 张 `硬币` 放入手牌。
- `硬币` 改为随回合成长的临时费用牌：1～3 回合 +1，4～6 回合 +2，7～8 回合 +3，第 9 回合开始时若仍在手牌中则移出游戏。
- `大魔力宝石` 从普通法术卡池和所有预组构筑中删除，费用爆发集中到可预期的天赋投资。
- 使魔数值调整：地雷女、墓誓骑士、奇迹守护者、铁律巨像按 v1.3 数值落地。
- 陷阱数值调整：镜像之墙 4 伤、伏击印记 3 伤、魔力干涸减少 2 点当前费用。
- 公共备牌终结者规制：卡奥斯、米迦勒、尤斯蒂娅带“进场后本回合跳过战斗阶段”的重压限制；米迦勒改为 10 费；尤斯蒂娅改为 4/6/6，删除吸血。
- 寒尘削弱：10 点跳脸改为磨 6 张，13 点基础磨牌改为 9 张。
- 墓地系统预接入：墓地记录现在保存来源区域、进入原因、回合数、是否被战斗破坏和战斗破坏者，为墓地主题卡池做准备。
- 新增测试使魔 `坟场拖拽者`，用于验证“被敌方使魔战斗破坏时拖下破坏者”的亡语机制。
- 21 套 starter 预设卡组按 v1.3 草案和 additional update 重排，主卡组仍为 50 张，同名最多 3 张，公共终结者不进入主卡组。

设计取舍：

- 公共终结者没有采用“所有 13 点神抽终结者本回合不能攻击”的统一规则，而是只把重压写入卡奥斯、米迦勒、尤斯蒂娅这类进场效果极强的个体。
- 绝影刺客·瞬保留疾风和无视护卫定位；乌洛波洛斯保留额外回合定位，二者不追加重压。
- 墓地主题当前先落规则记录能力和测试牌，不一次性扩张完整墓地卡池。

## v1.2.1 更新设计落地记录

本次更新把 `design/update.md` 新增的核心魔法、特殊使魔和槽位上限补丁并入现行设计：

- 公开大地牌库追加 `绝影刺客·瞬`，并把 `虚数之影·卡奥斯`调整为“最多磨 15 张，剩 7 张即停止”。
- 新增核心魔法：`时空篡夺`、`爆裂炎枪`、`流星火雨`、`大魔力宝石`。
- 新增盖伏陷阱：`魔力干涸`，用于打断对手 5 点当前费用节点。
- 槽位系统加入自然增长上限，默认跳脸槽 3 点、神抽槽 5 点；新天赋和 `逆境神龛`可提升对应上限。
- 平衡调整同步：`巨步推进`先手价格降为 3，`法术专注`改为法术伤害 +1。
- 卡牌重做同步：`招财猫`改为 2 费 1/1/1 亡语抽牌，`典籍猫头鹰`改为 2 费 2/3/3 战吼抽一弃一，`逆境神龛`威胁值改为 2 并提供神抽上限加成。

设计意图是让终盘大地牌库更有差异化，同时限制势能结算在单回合内过度滚雪球；高费用魔法提供明确的爆发窗口，但需要承担费用节点与盖伏干扰的风险。

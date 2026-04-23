# 《神どろ》游戏设计文档 (GDD)
## 基于《游戏规则手册 v1.0》的数字原型实现方案

---

## 零、文档定位与对齐原则

### 0.1 文档关系
- `game_rule.md` 是**规则事实源**。
- 本文档是**数字版实现设计**，负责把规则手册翻译成可开发、可测试、可扩展的系统方案。
- 若本文档中的实现假设与规则手册后续版本冲突，以规则手册为准。

### 0.2 项目目标
将《神どろ》规则文档落地为**可运行的数字卡牌游戏原型**，在 8–12 周内由 1–2 人完成 MVP。

### 0.3 核心体验承诺
1. **博弈深度**：围绕“天赋构筑 + 优劣双槽”形成可预测又有反转张力的局势推进。
2. **逆转爽感**：优势方靠跳脸槽扩大压制，劣势方靠神抽槽创造翻盘窗口。
3. **快速验证**：MVP 优先验证规则是否好玩，而不是追求内容量或商业化系统。

### 0.4 范围控制（MVP 不做）
- ❌ 联网对战
- ❌ 账号系统 / 排位赛
- ❌ 卡牌收集 / 开包 / 经济系统
- ❌ 复杂剧情演出 / 过场动画
- ❌ 大规模卡池与自定义卡组编辑器

### 0.5 规则补完原则
规则手册当前已经明确了核心玩法，但对数字实现仍有若干空白。本文档采用以下处理方式：
- 已被规则明确写明的内容：直接照规则实现。
- 规则未写但实现必需的内容：以“**实现假设**”单列说明。
- 规则存在潜在歧义的内容：给出“**建议实现口径**”，后续若规则修订，可局部替换。

---

## 一、规则对齐后的核心玩法摘要

### 1.1 基本规则
- **生命值**：每个角色初始 20 点。
- **胜利条件**：
  - 对方生命值归零。
  - 对方摸光牌库/手牌，无法继续行动。
- **卡牌类型**：
  - 使魔
  - 魔法
  - 持续魔法
  - 触发魔法（陷阱）

### 1.2 开局前决策
根据规则手册，游戏在正式开局前包含两层构筑：
1. **选择角色**
2. **消耗角色自带天赋点购买初始增益**

这意味着《神どろ》的“构筑”不是传统的赛前带牌，而是：
- 角色定义基础策略方向
- 天赋定义开局资源倾斜
- 预设卡组提供稳定验证环境

### 1.3 局势结算核心
每回合结束时，根据规则中的势能公式计算总势能差 `V`：

`V = 手牌分 + 血量分 + 威胁分 + 特殊状态分`

其中：
- 优势方会积累**跳脸槽**
- 劣势方会积累**神抽槽**

这套系统是全游戏的核心节奏器，数字版实现必须优先保证：
- 结算透明
- 结果可解释
- UI 可反馈

### 1.4 双槽爆发机制
规则手册已明确：
- **10 点效果**：回合开始宣布发动
- **13 点效果**：强制发动
- **槽位达到 13 点后不可继续存留**

数字版因此应将双槽视为“回合开始阶段的优先处理事件”，而不是普通主阶段动作。

---

## 二、需要数字实现补完的规则空白

以下内容不是规则手册当前已完全写死的部分，而是为了做出可运行原型必须给出的实现口径。

### 2.1 建议实现口径：先后手与起手
- 先手起手 3 张，后手起手 4 张。
- 后手额外获得 1 张“硬币”类临时资源牌，作为节奏补偿。
- 双方均可进行一次 Mulligan。

### 2.2 建议实现口径：费用系统
- 角色初始 `maxMana = 1`。
- 每回合开始时 `maxMana +1`，上限 10。
- 回合开始时法力回满至 `maxMana`。

### 2.3 建议实现口径：区域容量
- 战场上限：7 个使魔位。
- 手牌默认上限：10。
- 持续魔法区与陷阱区在 MVP 阶段不额外限制数量，但 UI 上最多同时展示 5 个，超出折叠。

### 2.4 建议实现口径：判负时点
规则原文是“摸光牌库/手牌（无法继续行动）”。为了便于编程与测试，MVP 建议解释为：
- 当玩家在**需要执行抽牌**时，牌库为空，且手牌也为空，则立即判负。
- 若牌库为空但手牌仍可正常操作，则暂不判负。

### 2.5 待规则补完项
以下问题对最终平衡影响较大，MVP 先按建议值实现，但应在测试后回写规则手册：
- 使魔能否在登场当回合攻击
- 使魔能否直接攻击敌方角色
- 触发效果与死亡效果的先后顺序
- 持续魔法是否拥有独立“威胁值”
- 角色被动与槽位结算的叠加优先级

---

## 三、技术栈推荐

### 3.1 首选方案：Web 纯前端

| 层级 | 选型 | 理由 |
|-----|------|------|
| 构建工具 | Vite | 零配置，热更新快 |
| 语言 | TypeScript | 规则对象复杂，类型约束能显著减少 Bug |
| 框架 | React + Zustand | 状态变更多、界面响应频繁，适合卡牌原型 |
| 样式 | Tailwind CSS | 原型期效率高 |
| 动画 | Framer Motion | 卡牌移动、翻面、拖拽反馈够用 |
| 存储 | localStorage | MVP 无需后端 |
| 部署 | GitHub Pages / Vercel | 免费且部署快 |

### 3.2 备选方案
- **CLI 版本（Node.js / Python）**：适合先只验证规则和平衡。
- **Godot Engine**：适合后续追求更强游戏感，但不适合作为 MVP 首选。

### 3.3 目录结构建议

```text
shindoro/
├── public/
│   └── cards/
├── src/
│   ├── data/
│   │   ├── cards.ts
│   │   ├── characters.ts
│   │   ├── talents.ts
│   │   └── decks.ts
│   ├── engine/
│   │   ├── gameState.ts
│   │   ├── rules.ts
│   │   ├── phases.ts
│   │   ├── slotResolver.ts
│   │   ├── effects.ts
│   │   └── ai.ts
│   ├── components/
│   │   ├── Card.tsx
│   │   ├── Board.tsx
│   │   ├── PlayerHUD.tsx
│   │   ├── SlotMeter.tsx
│   │   └── ResolutionPanel.tsx
│   ├── store/
│   │   └── useGameStore.ts
│   └── App.tsx
└── package.json
```

---

## 四、核心数据模型

### 4.1 卡牌 (Card)

```ts
type CardType = 'minion' | 'spell' | 'persistent' | 'trap';

interface Card {
  id: string;
  name: string;
  cost: number;
  type: CardType;

  attack?: number;
  health?: number;
  threat?: number;

  effects: Effect[];

  rarity?: 'common' | 'rare' | 'epic';
  description: string;
  flavor?: string;
  tags?: string[];
}
```

### 4.2 角色 (Character)

规则手册中的“角色 A / B / C”已经明确：
- 每个角色有不同的**基础天赋点**
- 每个角色有 1 个**专属特质**
- 每个角色对应不同战术定位

```ts
type CharacterId = 'character_a' | 'character_b' | 'character_c';

interface Character {
  id: CharacterId;
  name: string;
  baseHp: number;             // 默认 20
  talentPoints: number;       // 规则当前口径：A=5, B=4, C=7
  passive: PassiveAbility;
  deckId: string;             // 对应预设卡组
  description: string;
}
```

### 4.3 天赋 (Talent)

规则手册中的五类天赋应落成独立数据，而不是仅写在文案里。

```ts
type TalentCategory =
  | 'hpBoost'
  | 'handLimit'
  | 'topDeckSetup'
  | 'slotAcceleration'
  | 'manaOrDraw';

interface Talent {
  id: string;
  name: string;
  category: TalentCategory;
  cost: number;
  repeatLimit: number;
  effect: TalentEffect;
  description: string;
}
```

### 4.4 玩家状态 (PlayerState)

```ts
interface PlayerState {
  id: 'P1' | 'P2';
  character: CharacterId;

  hp: number;
  maxHp: number;
  handLimit: number;
  mana: number;
  maxMana: number;

  deck: Card[];
  hand: Card[];
  board: MinionInstance[];
  persistents: Card[];
  traps: Card[];
  reserveDeck: Card[];
  graveyard: Card[];

  jumpSlot: number;
  godDrawSlot: number;

  selectedTalents: string[];
  temporaryFlags: string[];
}
```

### 4.5 游戏状态 (GameState)

为了准确表达规则流程，`phase` 不应只保留“主阶段 / 结束阶段”。

```ts
type GamePhase =
  | 'characterSelect'
  | 'talentDraft'
  | 'openingDraw'
  | 'mulligan'
  | 'turnStart'
  | 'slotResolution'
  | 'mainTurn'
  | 'turnEnd'
  | 'gameOver';

interface GameState {
  phase: GamePhase;
  turn: number;
  currentPlayer: 'P1' | 'P2';
  players: { P1: PlayerState; P2: PlayerState };

  actionLog: GameAction[];
  effectStack: PendingEffect[];

  winner?: 'P1' | 'P2' | null;
}
```

### 4.6 势能分档与槽位增量

规则手册给出了 `V` 的计算，但没有给出“不同强度的优劣势分别加几点槽”。  
为了支撑角色 B 的“小劣算中劣”被动，数字实现需要补足分档。

MVP 建议采用：

| `|V|` 区间 | 局势等级 | 跳脸槽增量 | 神抽槽增量 |
|----------|---------|-----------|-----------|
| 0 | 均势 | 0 | 0 |
| 1–3 | 小优 / 小劣 | 1 | 1 |
| 4–6 | 中优 / 中劣 | 2 | 2 |
| 7+ | 大优 / 大劣 | 3 | 3 |

实现口径：
- 若 `V > 0`，则优势方按分档增加跳脸槽，劣势方按同档增加神抽槽。
- 若 `V < 0`，则角色对调。
- 若 `V = 0`，双方均不加槽。

这样既保留规则手册的“优势得跳脸、劣势得神抽”，又能让角色 B 的被动有明确落点。

---

## 五、游戏循环（状态机）

```text
[开局准备]
  ├─ 选择角色
  ├─ 购买天赋
  ├─ 抽取初始手牌
  └─ Mulligan
       ↓
[回合开始阶段]
  ├─ 回费 / 涨费
  ├─ 检查 13 点槽位并强制发动
  ├─ 检查 10 点槽位并允许声明发动
  ├─ 抽 1 张牌
  └─ 触发 onTurnStart
       ↓
[主要阶段]
  ├─ 出牌（使魔 / 魔法 / 持续 / 陷阱）
  ├─ 使魔攻击
  └─ 结束回合
       ↓
[回合结束阶段]
  ├─ 结算剩余触发
  ├─ 计算 V 值
  ├─ 根据局势分档增加跳脸槽 / 神抽槽
  ├─ 清除临时状态
  ├─ 检查胜负
  └─ 切换玩家
```

### 5.1 槽位发动顺序说明
为与规则手册统一，槽位发动不再视为主阶段普通动作，而是：
1. 回合开始时先处理 13 点强制效果
2. 再给玩家处理 10 点可选效果的机会
3. 然后进入正常抽牌与主阶段

如果后续规则希望改成“10 点也可留到主阶段任意时点发动”，只需调整 `slotResolution` 子阶段，不影响其余系统。

---

## 六、关键系统设计

### 6.1 天赋系统

天赋系统要解决的不是“角色升级”，而是“开局资源倾斜”。

建议每类天赋都做成参数化配置：

```ts
type TalentEffect =
  | { type: 'addMaxHp'; amount: number }
  | { type: 'addHandLimit'; amount: number }
  | { type: 'setTopDeck'; cardId: string }
  | { type: 'modifySlotGain'; slot: 'jump' | 'godDraw'; amount: number }
  | { type: 'bonusMana'; amount: number }
  | { type: 'bonusDraw'; amount: number };
```

实现要求：
- 天赋购买只在开局进行。
- 天赋效果在进入首回合前全部结算完毕。
- 可重复购买的天赋必须声明上限。
- UI 需要实时显示剩余天赋点。

### 6.2 势能结算

```ts
function calculateAdvantage(me: PlayerState, opp: PlayerState): number {
  let handScore = me.hand.length - opp.hand.length;
  if (me.hand.length > 7 || opp.hand.length > 7) handScore *= 2;

  const hpDiff = me.hp - opp.hp;
  const hpScore =
    Math.abs(hpDiff) > 4
      ? Math.sign(hpDiff) * Math.floor((Math.abs(hpDiff) - 4) / 4 + 1)
      : 0;

  const threatScore = boardThreat(me) - boardThreat(opp);

  let special = 0;
  if (me.deck.length <= 5) special -= 2;
  if (me.hp < boardAttack(opp)) special -= 3;

  return handScore + hpScore + threatScore + special;
}
```

实现要求：
- 势能明细必须可展示，不能只显示最终数值。
- 每个加减项都应进入 `actionLog`，便于复盘。
- 持续魔法若参与威胁值，必须在卡牌数据中显式写出 `threat` 或定义统一换算公式。

### 6.3 角色被动实现建议

#### 角色 A
- 基础天赋点：5
- 被动：增加跳脸槽时额外 +1
- 实现方式：在 `resolveSlotGain('jump')` 后追加修正

#### 角色 B
- 基础天赋点：4
- 被动：小劣算中劣
- 建议实现：
  - 若本应获得 `1` 点神抽槽，则改为获得 `2` 点
  - 同时取消对方由该次结算获得的 `1` 点跳脸槽

#### 角色 C
- 基础天赋点：7
- 被动：每回合扣除 1 点跳脸槽
- 实现方式：在自己的 `turnStart` 阶段结算前先执行 `jumpSlot = max(0, jumpSlot - 1)`

### 6.4 双槽爆发系统

```ts
function onTurnStart(player: PlayerState) {
  if (player.jumpSlot >= 13) {
    executeUltimateJump(player);
    player.jumpSlot = 0;
  }

  if (player.godDrawSlot >= 13) {
    executeUltimateGodDraw(player);
    player.godDrawSlot = 0;
  }

  // 若达到 10 点，则进入声明发动流程
}
```

设计要求：
- 10 点技能必须让玩家“明确做出是否发动”的选择。
- 13 点技能必须自动处理，不能跳过。
- UI 上同时显示当前数值、下一阈值和即将触发的效果说明。

### 6.5 效果系统（数据驱动）

```ts
type EffectAction =
  | { type: 'damage'; target: Target; amount: number }
  | { type: 'heal'; target: Target; amount: number }
  | { type: 'draw'; count: number }
  | { type: 'summon'; cardId: string }
  | { type: 'buff'; target: Target; atk?: number; hp?: number }
  | { type: 'destroy'; target: Target }
  | { type: 'addSlot'; slot: 'jump' | 'godDraw'; amount: number }
  | { type: 'discard'; target: 'self' | 'opponent'; count: number }
  | { type: 'setTopDeck'; target: 'self' | 'opponent'; cardId: string }
  | { type: 'discountNextDraw'; amount: number };

interface Effect {
  trigger: 'onPlay' | 'onDeath' | 'onTurnStart' | 'onTriggerMet';
  action: EffectAction;
  condition?: Condition;
}
```

MVP 原子效果以“支持规则核心”为准，不追求覆盖所有脑洞。

### 6.6 AI 对手（MVP：加权贪心）

```ts
function aiTurn(state: GameState) {
  // 1. 枚举所有合法动作
  // 2. 为动作打分：
  //    - 造成角色伤害
  //    - 清除敌方威胁
  //    - 增加己方威胁
  //    - 抽牌或检索
  //    - 触发 10 点槽位爆发
  // 3. 执行最高分动作，直到无动作可做
}
```

AI 需要额外理解两件事：
- 神抽槽 10 点和 13 点的价值不能按普通抽牌看待
- 跳脸槽应在“能终结或构建强压制”时优先发动

---

## 七、MVP 内容范围

### 7.1 卡牌数量

| 类别 | MVP 数量 | 备注 |
|-----|---------|------|
| 使魔 | 15 | 覆盖前中期曲线 |
| 魔法 | 10 | 覆盖直伤、解场、抽牌 |
| 持续魔法 | 3 | 重点验证持续威胁与槽位互动 |
| 触发魔法 | 2 | 先做最基础的触发反制 |
| 合计 | 30 | 足够支撑 3 套预组 |

### 7.2 角色数量
- 3 个角色：A / B / C
- 每个角色包含：
  - 1 个专属被动
  - 1 套预设卡组
  - 1 个简短风格说明

### 7.3 天赋数量
- 5 类基础天赋
- 每类先做 1–2 个可购买条目
- 总条目控制在 8–10 个以内，避免前期平衡爆炸

### 7.4 不进入 MVP 的内容
- 自定义卡组构筑
- 多角色被动叠层联动
- 复杂连锁陷阱
- 超过 13 点后的额外溢出规则

---

## 八、UI / UX 设计

### 8.1 布局（桌面端优先）

```text
┌──────────────────────────────────────────────────┐
│ [对手头像] HP:20  Mana:3/3  跳脸:6  神抽:2       │
│           [对手手牌（背面）]                      │
│ ┌──────────────────────────────────────────┐     │
│ │          对手战场（最多 7 格）             │    │
│ ├──────────────────────────────────────────┤     │
│ │          我方战场                          │    │
│ └──────────────────────────────────────────┘     │
│           [我方手牌（正面，可拖拽）]             │
│ [我方头像] HP:18  Mana:5/5  跳脸:3  神抽:8       │
│     [势能明细按钮]        [槽位发动按钮] [结束回合]│
└──────────────────────────────────────────────────┘
```

### 8.2 UI 的关键责任
- 让玩家一眼看懂当前谁优谁劣
- 让玩家知道槽位为何增长
- 让玩家知道 10 点能发动什么、13 点会被强制触发什么

### 8.3 关键交互
- **拖拽出牌**：手牌拖到战场或目标区域
- **势能面板**：显示 `V = +3` 的组成细目
- **槽位提示**：满 10 时高亮，满 13 时显示“下回合强制发动”
- **日志面板**：记录本回合关键事件、死亡结算和槽位变化

### 8.4 低成本游戏感方案
- 出牌时卡牌轻微放大与位移
- 受伤时 HUD 数值跳动
- 槽位突破阈值时触发屏幕边缘闪光
- 神抽触发时使用更强的牌面高亮与抽牌轨迹动画

---

## 九、开发路线图（8–12 周）

### Phase 1：规则引擎（周 1–3）
- [ ] 定义 `Card` / `Character` / `Talent` / `GameState`
- [ ] 实现牌库、抽牌、出牌、伤害、墓地
- [ ] 实现基础回合流转
- [ ] 实现势能公式
- [ ] 用日志跑通无 UI 对局
- 里程碑：CLI 能完成一局最小规则对战

### Phase 2：核心机制（周 3–5）
- [ ] 实现天赋购买
- [ ] 实现双槽系统
- [ ] 实现角色 A / B / C 被动
- [ ] 实现持续魔法与触发魔法
- [ ] 补齐判负时点与连锁顺序
- 里程碑：规则手册核心内容全部可运行

### Phase 3：前端可玩版本（周 5–8）
- [ ] 战场与手牌 UI
- [ ] HUD 与槽位条
- [ ] 势能说明面板
- [ ] 10 点发动交互
- [ ] 回合日志与结算提示
- 里程碑：本地热座可完整游玩

### Phase 4：AI 与打磨（周 8–10）
- [ ] 贪心 AI
- [ ] 3 套预组调整
- [ ] 基础教学引导
- [ ] 本地存档
- 里程碑：可给外部玩家试玩

### Phase 5：平衡与发布（周 10–12）
- [ ] 调整卡牌与角色数值
- [ ] 修 Bug
- [ ] 打磨 UI 提示
- [ ] 部署 Vercel / GitHub Pages
- 里程碑：v1.0 Alpha 发布

---

## 十、平衡性与测试

### 10.1 平衡目标
- 三个角色都要有清晰打法
- 角色胜率目标控制在 45%–55%
- 槽位机制应带来逆转，而不是直接滚雪球到无解

### 10.2 测试重点
1. 角色 A 是否因高频跳脸过强
2. 角色 B 的“小劣算中劣”是否会导致过度防守收益
3. 角色 C 的高天赋点是否足以覆盖其被动扣槽的代价
4. 神抽槽 13 点是否会过度破坏随机性
5. 持续魔法的威胁值是否会让势能公式失真

### 10.3 数据驱动要求
- 所有角色参数放在 `characters.ts`
- 所有天赋参数放在 `talents.ts`
- 所有卡牌参数放在 `cards.ts`
- 所有 `V` 分档与槽位映射放在 `slotResolver.ts`

---

## 十一、风险与取舍

| 风险 | 应对 |
|-----|------|
| 规则存在未定项 | 在本文档显式标为“实现假设”，避免误当正式规则 |
| 槽位系统解释成本高 | 强制做势能面板和回合日志 |
| 角色被动影响过大 | 先只做 3 个角色，集中平衡 |
| 持续/触发效果拖慢开发 | MVP 只做最基础版本，不做复杂连锁 |
| AI 无法理解槽位价值 | 将槽位收益单独写进评分函数 |

---

## 附录 A：首批实现清单

```bash
# 初始化项目
npm create vite@latest shindoro -- --template react-ts
cd shindoro
npm install zustand framer-motion
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

第一周建议顺序：
1. 先定义 `Character` / `Talent` / `Card` / `GameState`
2. 再写最小回合循环
3. 然后补势能计算与双槽逻辑
4. 最后再接 UI

---

## 附录 B：本文档相对旧版的关键修正

- 以 `game_rule.md` 为规则主源，不再把设计假设写成既定事实
- 删除了与规则冲突的“先手 5 / 后手 6 天赋点预算”口径
- 将双槽发动时机统一为“回合开始阶段处理”
- 为角色 A / B / C 补足了可直接实现的被动说明
- 为 `V` 值增加了分档与槽位增量映射，支撑数字实现

---

**© 2026 神どろ (Shin Doro) | 游戏设计文档 v1.1**

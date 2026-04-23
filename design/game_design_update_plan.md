# `game_design` 更新后的具体实施方案

本方案以更新后的 [game_design.md](./game_design.md) 为目标设计，以当前仓库现有实现为对照，按 `SKILL.md` 规定的顺序整理。

---

## 差分

- 新增：
  - 6 名首发角色（A-F），而不是当前实现中的 3 名角色
  - 50 张主卡组与同名最多 3 张的构筑规则
  - 动态定价天赋与先后手限定天赋
  - 更完整的五段回合流
  - 一整套基础 / 高阶使魔关键词
  - 更完整的赛前信息与势能解释 UI

- 删除：
  - 旧版设计中依赖 `v1.0 / v1.1` 的若干原型限定口径
  - 与当前仓库不一致的 `React + Zustand + Vite` 作为默认技术路线的描述

- 调整：
  - 规则事实源统一为 `design/game_rule.md`
  - 设计文档从“旧原型说明”转为“v1.2 目标实现设计”
  - 当前架构基线改为仓库已存在的 `data / engine / store / components` 分层

- 影响范围：
  - 文档：`design/game_design.md`、`memory-bank/progress.md`
  - 数据：`src/data/characters.ts`、`src/data/talents.ts`、`src/data/decks.ts`、`src/data/cards.ts`
  - 类型：`src/types.ts`
  - 引擎：`src/engine/gameState.ts`、`src/engine/phases.ts`、`src/engine/effects.ts`、`src/engine/rules.ts`、`src/engine/slotResolver.ts`、`src/engine/ai.ts`
  - UI：`src/App.tsx`、`src/components/`
  - 测试：`tests/engine.test.js`

---

## 现状

当前代码实现仍停留在较早的原型阶段，主要表现为：

- 角色只有 A / B / C 三名，数据位于 `src/data/characters.ts`
- 天赋只有 7 条，且只有单一 `cost`，没有动态定价
- 预组牌库仍是 30 张，配置位于 `src/data/decks.ts`
- `GamePhase` 只有 `setup / mulligan / turnStart / slotResolution / mainTurn / gameOver`
- 当前关键词体系几乎只落地了 `rush`、`onDeath`、`onTurnStart` 与陷阱触发
- 战斗目标当前不受“护卫”类规则限制
- `EffectAction` 尚不支持大量 v1.2 角色技能和关键词所需动作
- 测试主要覆盖当前原型的基础优势值、槽位和回合流，没有覆盖 v1.2 新系统

这意味着：设计文档已经提升到 v1.2 目标，但当前实现仍明显偏向 v1.1 原型。

---

## 实装后的预想

完成更新后，仓库应达到以下状态：

- `design/game_design.md` 与 `design/game_rule.md` 保持一致
- 当前数字原型具备向 v1.2 规则升级的清晰落地路径
- 数据层能够表达 6 角色、动态天赋、50 张主卡组与更完整卡牌能力
- 引擎层能够表达五段回合流与更丰富关键词
- UI 能向玩家清楚解释势能结算、槽位变化、角色被动和天赋差异
- 测试覆盖从“旧原型是否能跑”升级到“新规则骨架是否正确”

理想结果不是“一步到位做完全部内容”，而是：

- 规则骨架先正确
- 数据结构先扩出来
- 旧原型可以逐步迁移到新规则

---

## 如何实装

### 文档层

- 保持 `design/game_rule.md` 作为规则事实源
- 使用更新后的 `design/game_design.md` 作为实现目标说明
- 使用本方案文档跟踪设计到代码的落地路径

### 数据层

- 先升级 `src/types.ts` 中角色、天赋、阶段、动作相关结构
- 再扩展 `src/data/characters.ts`、`talents.ts`、`decks.ts`
- 最后根据缺失关键词补 `src/data/cards.ts`

### 引擎层

- `phases.ts` 先做阶段拆分
- `slotResolver.ts` 处理 v1.2 槽位逻辑
- `effects.ts` 处理关键词与动作扩展
- `rules.ts` 处理威胁值与势能计算扩展
- `ai.ts` 最后再跟进新角色与新天赋

### UI 层

- `src/App.tsx` 与赛前界面先支持更完整的角色 / 天赋信息
- `src/components/Board.tsx`、`PlayerHUD.tsx`、`ResolutionPanel.tsx` 再补势能解释、槽位提示和关键词展示

### 测试层

- 先补类型 / 规则级测试
- 再补阶段流测试
- 最后补角色、关键词和天赋测试

---

## 具体的步骤

1. 先冻结 v1.2 规则口径，以 `design/game_rule.md` 作为唯一规则事实源，避免边写代码边改规则口径。
2. 先升级 `src/types.ts`，补齐：
   - 更完整的 `GamePhase`
   - 更多 `PassiveKey`
   - 动态定价天赋结构
   - 新关键词 / 新动作需要的数据表达
3. 升级 `src/data/characters.ts`，把角色从 3 名扩到 6 名，并为新增角色补齐被动与 10 / 13 点技能。
4. 升级 `src/data/talents.ts`，把单一费用改成先后手动态费用结构，同时加入限定天赋。
5. 升级 `src/data/decks.ts`，把 30 张预组改成符合 50 张主卡组规则的配置结构，并明确备牌库来源。
6. 升级 `src/engine/phases.ts`、`slotResolver.ts`、`rules.ts`，先把回合阶段、势能结算和双槽流程改对。
7. 升级 `src/engine/effects.ts` 与相关战斗逻辑，逐步补齐护卫、连击、回复、魔抗等基础关键词，再扩到高阶关键词。
8. 升级 `src/components/` 和 `src/App.tsx`，让 UI 能展示新的角色、天赋价格、势能明细和关键词状态。
9. 按模块补测试，至少新增：
   - 角色 A-F 数据与技能测试
   - 动态定价天赋测试
   - 五段回合流测试
   - 槽位 10 / 13 点测试
   - 关键词合法性测试
10. 每完成一层升级，就同步 `memory-bank/progress.md`，必要时更新 `memory-bank/architecture.md`。

---

## 关联修正检查

- 是否需要同步修正 `README.md` 中关于当前原型规模、角色数、规则阶段的描述。
- 是否需要同步修正 `AGENT.md` 或 `memory-bank/architecture.md` 中对设计文档职责的说明。
- 是否需要同步修正 `src/App.tsx` 中赛前界面文案，使其不再暗示旧版原型范围。
- 是否需要同步修正 `dist/` 构建产物；若有源码变更，应重新执行构建。
- 是否需要补充 `tests/engine.test.js` 之外的新测试文件，以免单文件测试难以承载 v1.2 规则升级。

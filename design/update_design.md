# 《神どろ》公共终极卡牌与大魔法更新设计书

本设计书以 [update.md](./update.md) 为更新目标，以 [game_rule.md](./game_rule.md)、[game_design.md](./game_design.md)、[minion.md](./minion.md) 和当前源码结构为对照，按仓库 `SKILL.md` 的内容更新流程整理。

## 差分

- 新增：
  - 4 张公共备牌库终结者：
    - `时空篡夺者·乌洛波洛斯`
    - `神罚代行者·米迦勒`
    - `虚数之影·卡奥斯`
    - `绝对裁决者·尤斯蒂娅`
  - 6 张战略级大魔法：
    - `神之愤怒`
    - `万雷天引`
    - `虚无结界`
    - `净化之光`
    - `真实的探照灯`
    - `停滞的时沙`
  - 关键词速查口径：
    - 护卫、疾风、连击、回复、魔抗
    - 吸血、潜行、死斗/必杀、遗言、威压、看破

- 删除：
  - 暂无明确删除项。
  - 本次更新不是替换现有护卫包、旧法术或现有终结者，而是扩展公共卡池与关键词规则。

- 调整：
  - 备牌库不再只承担“3 张角色或公共备用牌”的轻量补充定位，而要能承载规则级终极解药。
  - 大魔法需要覆盖全场清场、单向清场、持续魔法拆除、陷阱拆除和下回合资源惩罚。
  - 关键词口径需要从“当前已实现 tags”扩展为可供规则文档、图鉴、数据和 UI 统一引用的术语表。

- 影响范围：
  - 文档：
    - `design/game_rule.md`
    - `design/game_design.md`
    - `design/minion.md`
    - `memory-bank/progress.md`
  - 数据：
    - `src/data/cards/minions/`
    - `src/data/cards/spells.ts`
    - `src/data/decks.ts`
  - 类型：
    - `src/types.ts`
  - 引擎：
    - `src/engine/effects.ts`
    - `src/engine/phases.ts`
    - `src/engine/rules.ts`
    - `src/engine/slotResolver.ts`
  - UI：
    - `src/components/react/CardView.tsx`
    - `src/components/react/ReactBattleBoard.tsx`
    - `src/components/react/PlayerHUDView.tsx`
  - 测试：
    - `tests/engine.test.js`

## 现状

当前项目已经完成 v1.2 规则骨架的一部分：

- `DeckConfig` 已包含 `mainDeck` 与 `sideboard`。
- `GamePhase` 已包含 `turnStart / slotResolution / draw / mainTurn / combat / turnEnd`。
- 天赋系统已具备先后手动态定价结构。
- 卡牌数据已经拆分为 `minions / spells / persistents / traps`。
- `design/minion.md` 是当前实际维护的使魔图鉴文件。
- 护卫包已实现部分关键词与动作：
  - `guard`
  - `menace`
  - `magicRes`
  - `onAttacked`
  - `addCardToHand`
  - `grantAdjacentGuard`
  - `buffSelfIfHeroHpBelow`

但当前实现与 `update.md` 的目标仍有差距：

- 公共备牌库终结者尚未加入数据层。
- `src/data/cards/spells.ts` 目前以低中费通用法术为主，尚未覆盖大魔法系列。
- 效果动作缺少若干规则级能力：
  - 额外回合
  - 额外回合失败后强制败北
  - 放逐所有魔法卡
  - 破坏除自身外所有使魔
  - 生命值互换
  - 禁止双方发动跳脸或神抽
  - 破坏所有持续魔法
  - 破坏对方所有持续魔法
  - 破坏对方所有盖伏触发魔法
  - 将敌方牌库磨到指定剩余数量
- 关键词体系尚未完全统一命名：
  - 当前源码使用 `rush / guard / menace / magicRes` 等英文 tag。
  - 设计文档使用 `疾风 / 护卫 / 威压 / 魔抗` 等中文名。
- `update.md` 中“看破”条目目前在末尾截断，无法确认完整规则文本，需要在实装前补全。

## 实装后的预想

更新完成后，公共卡池会形成两类新的高影响内容。

第一类是 13 点神抽主要检索目标：

- 乌洛波洛斯提供额外回合，但带有失败即败北的终极风险。
- 米迦勒提供战场和魔法区重置，并把被破坏卡牌转化为回复。
- 卡奥斯针对厚牌库或资源型对手，把敌方牌库压缩到危机线附近。
- 尤斯蒂娅通过血量互换和禁用双槽爆发，制造防守反击的最大逆转窗口。

第二类是主卡组可编入的大魔法工具：

- 清场类大魔法负责直接改变威胁分和斩杀线。
- 支援拆除类大魔法负责处理持续魔法与盖伏陷阱。
- 资源禁锢类大魔法负责限制对手下回合可用费用，形成跳脸或防守窗口。

玩家最终会看到的变化：

- 神抽 13 点选择池里出现更鲜明的“绝地反击”选项。
- 主卡组构筑出现控制、清场、反陷阱、反持续魔法和资源压制工具。
- 卡牌详情、日志和势能面板能解释这些卡如何改变威胁分、血量分、牌库危机和槽位行动。
- 关键词在卡面、图鉴、规则文档和代码 tag 之间形成可追踪映射。

## 如何实装

### 文档层

- 将本设计书作为 `update.md` 到实装任务的桥接文档。
- 在 `design/game_rule.md` 中补充公共终极备牌库、大魔法系列和关键词速查表的规则口径。
- 在 `design/game_design.md` 中补充数据层、效果层、UI 与测试层的实现设计。
- 在 `design/minion.md` 中追加 4 张公共备牌库终结者。
- 若后续把大魔法也拆成独立图鉴，建议新增 `design/spell.md`；在此之前可先由 `game_rule.md` 与 `game_design.md` 承载。

### 数据层

- 公共备牌库终结者建议新增独立模块：
  - `src/data/cards/minions/sideboardFinishers.ts`
- 再由 `src/data/cards/minions.ts` 聚合导出。
- 大魔法可以先加入：
  - `src/data/cards/spells.ts`
- 如果后续法术数量继续增长，再拆为：
  - `src/data/cards/spells/basic.ts`
  - `src/data/cards/spells/highLevel.ts`
- `src/data/decks.ts` 需要确认公共备牌库来源：
  - 方案 A：每个角色 sideboard 显式包含公共终结者。
  - 方案 B：保留角色 sideboard，同时新增全局公共 sideboard 池。
  - 建议先采用方案 A，改动最直观，测试也更容易锁定。

### 类型层

需要扩展 `EffectAction` 以承载规则级效果。建议新增动作类型：

- `grantExtraTurn`
- `loseGameAtEndOfExtraTurnUnlessOpponentDefeated`
- `exileAllMagicCards`
- `destroyAllMinionsExceptSource`
- `healForEachDestroyedCard`
- `millDeckUntilRemaining`
- `swapHeroHp`
- `setSlotAbilitiesDisabled`
- `destroyAllMinions`
- `destroyAllEnemyMinions`
- `destroyAllPersistents`
- `destroyAllEnemyPersistents`
- `destroyAllEnemyTraps`
- `applyOpponentNextTurnManaMultiplier`

其中已有的 `applyOpponentNextTurnManaPenalty` 可以用于近似实现“费用点减半”，但如果要精确表达“减半并向下取整”，建议改为乘区或专用 action，而不是用固定扣点替代。

### 引擎层

- `effects.ts`
  - 负责新增动作的实际执行。
  - 清场动作要区分破坏、放逐、进入墓地和是否触发遗言。
  - 米迦勒的“放逐魔法卡”需要明确覆盖持续魔法与触发魔法，是否覆盖手牌/墓地中的魔法卡需由规则文档补充。
- `phases.ts`
  - 负责额外回合插入与额外回合结束时的败北检查。
  - 负责下回合费用减半的阶段结算。
- `slotResolver.ts`
  - 负责尤斯蒂娅的双槽禁用状态。
  - 负责 13 点神抽折扣后，这批终结者和大魔法的费用变化。
- `rules.ts`
  - 负责关键词对势能和目标合法性的影响。
  - 威压、潜行、魔抗、护卫、看破都应在这里形成可复用判断。

### UI 层

- 卡牌详情 tooltip 需要显示：
  - 是否为公共备牌库终结者。
  - 是否带有强制败北、禁用双槽、血量互换等高风险标记。
  - 大魔法的影响范围：全场、敌方、持续魔法、陷阱、下回合费用。
- 战斗日志需要新增关键事件：
  - 获得额外回合。
  - 额外回合未击败对手而败北。
  - 清场破坏数量与回复量。
  - 敌方牌库被压缩到 7 张。
  - 双方生命值互换。
  - 双槽发动被禁用。
  - 持续魔法或陷阱被拆除。
- 势能面板需要能解释：
  - 清场后威胁分变化。
  - 卡奥斯导致的牌库危机特殊扣分。
  - 尤斯蒂娅血量互换后的血量分变化。

### 测试层

至少补充以下测试：

- 乌洛波洛斯：
  - 进场后获得额外回合。
  - 额外回合结束未击败对手时，使用者败北。
- 米迦勒：
  - 放逐持续魔法和触发魔法。
  - 破坏除自身外所有使魔。
  - 按破坏数量回复。
- 卡奥斯：
  - 敌方卡组大于 7 时被磨到 7。
  - 敌方卡组小于等于 7 时不触发。
- 尤斯蒂娅：
  - 进场交换双方 HP。
  - 在场时双方不能发动跳脸或神抽。
  - 离场后双槽发动恢复。
- 大魔法：
  - 全场清场。
  - 单向清场。
  - 全场持续魔法拆除。
  - 单向持续魔法拆除。
  - 敌方盖伏陷阱拆除。
  - 下回合费用减半。
- 关键词：
  - 护卫目标限制。
  - 疾风召唤当回合可攻击。
  - 连击每回合可攻击两次。
  - 回复阶段恢复。
  - 魔抗不能被指定型敌方魔法和效果选择。
  - 吸血按造成伤害回复。
  - 潜行在首次主动攻击前不可被指定。
  - 必杀对使魔造成伤害后直接破坏。
  - 威压影响敌方威胁值。
  - 看破规则在 `update.md` 补全后再加测试。

## 具体的步骤

1. 先补全 `design/update.md` 中“看破”条目的截断文本，确认最终规则口径。
2. 更新 `design/game_rule.md`：
   - 加入公共终极备牌库章节。
   - 加入大魔法系列章节。
   - 合并关键词速查表，并统一中英文 tag 映射。
3. 更新 `design/game_design.md`：
   - 补充本次新增卡牌的模块落点。
   - 补充新增 `EffectAction` 与状态字段设计。
   - 补充 UI、日志、势能解释和测试策略。
4. 更新 `design/minion.md`：
   - 追加 4 张公共备牌库终结者。
   - 标记其来源为公共 sideboard / 13 点神抽主要目标。
5. 扩展 `src/types.ts`：
   - 加入新增 effect action。
   - 若需要，加入额外回合、双槽禁用和下回合费用乘区等临时状态。
6. 新增 `src/data/cards/minions/sideboardFinishers.ts`，并从 `src/data/cards/minions.ts` 聚合。
7. 在 `src/data/cards/spells.ts` 中加入 6 张大魔法，或先拆出 `highLevel.ts` 后再聚合。
8. 更新 `src/data/decks.ts`，确认每名角色 sideboard 都能访问公共终结者。
9. 在 `src/engine/effects.ts` 中实现新增动作。
10. 在 `src/engine/phases.ts` 中实现额外回合与费用减半。
11. 在 `src/engine/slotResolver.ts` 中处理双槽禁用与神抽折扣联动。
12. 在 `src/engine/rules.ts` 中统一关键词合法性与势能影响。
13. 更新 React 战斗 UI：
    - 卡牌详情 tooltip。
    - 日志文案。
    - 势能面板说明。
14. 补充引擎测试。
15. 执行：
    - `npm.cmd test`
    - `npm.cmd run build`
16. 更新 `memory-bank/progress.md`；如果架构职责发生变化，再更新 `memory-bank/architecture.md`。

## 关联修正检查

- `design/update.md`
  - “看破”规则文本当前截断，实装前必须补全。
- `design/game_rule.md`
  - 需要同步公共终极备牌库、大魔法、关键词速查表。
- `design/game_design.md`
  - 需要同步新增卡牌、动作、状态、UI 和测试设计。
- `design/minion.md`
  - 需要追加 4 张公共终结者。
- `src/data/cards/minions/`
  - 需要新增公共备牌库终结者定义。
- `src/data/cards/spells.ts`
  - 需要新增大魔法定义，或拆分法术模块后聚合。
- `src/data/decks.ts`
  - 需要确认 sideboard 是否包含公共终结者。
- `src/types.ts`
  - 需要支持额外回合、败北检查、禁用双槽、放逐、清场、血量互换、费用减半等动作。
- `src/engine/effects.ts`
  - 需要实现新增动作，并明确破坏与放逐是否触发遗言。
- `src/engine/phases.ts`
  - 需要实现额外回合、额外回合败北检查和下回合费用减半。
- `src/engine/slotResolver.ts`
  - 需要支持双槽禁用状态，并和 10 / 13 点发动流程兼容。
- `src/engine/rules.ts`
  - 需要统一关键词、目标合法性和势能影响。
- `src/components/react/`
  - 需要同步卡牌详情、日志、提示和势能解释。
- `tests/engine.test.js`
  - 需要补新增卡牌、关键词、清场、sideboard 和双槽禁用测试。
- `dist/`
  - 只有实际源码或站点内容变更后才需要通过构建同步；本设计书生成阶段无需更新。


# 使魔威胁值可视化与双方势能面板改修计划

## 差分

- 新增：
  - 所有使魔展示位统一显示 `攻击力 / 血量 / 威胁值` 三个属性。
  - 新增双方势能面板模块，分别展示玩家与 AI 的：
    - 手牌分
    - 血量分
    - 威胁值分
    - 特殊扣分
    - 总势能分
- 删除：
  - 无需删除底层规则数据，但当前只显示“攻 / 血”的使魔展示方式将不再满足需求。
  - 当前侧边栏里仅有一张简化版“优势值”摘要卡，不足以承担新的势能解释需求。
- 调整：
  - 将现有“优势值”展示升级为更完整的“势能面板”。
  - 势能面板不再只看 `state.lastAdvantage.summary` 的摘要文本，而是直接展示可核对的分项数值。
  - 为了方便玩家计算势能差分，面板应优先展示“当前局面的实时预估”，而不是只显示上一次回合结束时的结算结果。
- 影响范围：
  - `src/components/Card.tsx`
  - `src/components/Board.tsx`
  - `src/style.css`
  - `src/types.ts`
  - `src/engine/rules.ts`
  - `src/engine/phases.ts`
  - `tests/engine.test.js`

## 现状

- 规则层已经有“威胁值”：
  - `design/game_rule.md` 已明确使魔基础面板包含攻击力、血量、威胁值。
  - `src/data/cards/minions.ts` 的使魔数据已配置 `threat`。
  - `src/engine/rules.ts` 已用 `boardThreat()` 与 `getAdvantageBreakdown()` 参与势能计算。
- 运行时也有“威胁值”：
  - `src/types.ts` 的 `RuntimeCard`、`MinionInstance`、`PersistentInstance` 都有 `threat` 字段。
  - `createMinionInstance()` 已把使魔威胁值带进运行时实例。
- 当前缺的是 UI 可视化：
  - `src/components/Card.tsx` 里的 `renderMinionStats()` 只显示“攻 / 血”，没有显示“威胁值”。
  - 这会影响手牌中的使魔、Mulligan 使魔、场上使魔三类展示。
- 当前势能展示过于简化：
  - `src/components/Board.tsx` 现在只渲染一个“优势值”卡片。
  - 该卡片主要依赖 `state.lastAdvantage.summary` 与 `value`，只展示玩家视角的简述。
  - 面板里没有把双方的分项数值并列展示，也不能直接帮助玩家核对双方势能差。
- 当前结算记录也不够完整：
  - `src/types.ts` 的 `LastAdvantage` 目前只保存 `p1Breakdown`，没有显式保存 `p2Breakdown`。
  - 对于“双方势能面板”来说，这个结构不够直接，尤其是 `specialScore.details` 这种不能简单取反的信息。

## 实装后的预想

- 所有使魔卡面统一显示三项核心属性：
  - `攻`
  - `血`
  - `威`
- 玩家在手牌区、换牌界面、场上战场区查看使魔时，都能直接看到威胁值，不再需要从规则文档反推。
- 侧边栏新增一个更完整的“势能面板”模块：
  - 同时显示玩家与 AI 的势能构成。
  - 每一侧都能看到 `手牌分 / 血量分 / 威胁值分 / 特殊扣分 / 总势能分`。
  - 玩家可以直接对照双方总势能分，快速理解当前谁是优势方、差距来自哪里。
- 面板应优先呈现“当前局面的实时预估”：
  - 这样在主要阶段和战斗阶段中，玩家调整场面后可以立刻看到势能变化。
  - 若需要保留原有回合结束后的正式结算结果，可以在同一区域保留一个“上次结算 V 值”提示。

## 如何实装

- 数据与规则层：
  - 继续复用 `src/engine/rules.ts` 中现有的 `getAdvantageBreakdown()`，避免重新发明势能公式。
  - 为了支持“双方势能面板”和“上次结算记录”，建议把 `LastAdvantage` 扩展为同时保存 `p1Breakdown` 与 `p2Breakdown`。
  - 在 `src/engine/phases.ts` 的回合结束结算位置，同时计算并保存两侧 breakdown。
- UI 层：
  - 将 `src/components/Card.tsx` 的 `renderMinionStats()` 扩展为显示三项属性。
  - 该函数同时服务手牌、换牌卡和场上使魔，可一次改动覆盖全部使魔展示位。
  - 为保持模块化，建议新增一个独立组件，例如 `src/components/MomentumPanel.tsx`，专门负责渲染双方势能面板。
  - `src/components/Board.tsx` 只负责把当前状态整理后传给该面板，而不把所有 HTML 拼接逻辑继续堆进 `Board.tsx`。
- 展示策略：
  - “当前预估势能”建议在渲染时直接根据当前 `state.players.P1 / P2` 调用 `getAdvantageBreakdown()` 现算。
  - “上次结算结果”继续使用 `state.lastAdvantage`，作为说明本回合槽位结算依据的补充信息。
  - 双方分数应分别按各自视角计算：
    - 玩家面板用 `getAdvantageBreakdown(P1, P2)`
    - AI 面板用 `getAdvantageBreakdown(P2, P1)`
  - 不建议简单把玩家分数取反后当作 AI 分数，因为 `specialScore.details` 等信息可能并不完全对称。
- 样式层：
  - `src/style.css` 需要给第三个属性徽章和新的势能面板布局补样式。
  - 势能面板建议使用清晰的双列结构或上下双卡结构，确保桌面端和移动端都易读。
- 测试层：
  - `tests/engine.test.js` 建议补一条针对 `getAdvantageBreakdown()` 或 `LastAdvantage` 扩展结果的断言。
  - 重点验证双方分项是否按预期保存，而不是只验证总分。

## 具体的步骤

1. 确认本次改修采用的展示假设：势能面板以“当前实时预估”为主，并保留“上次结算结果”作为补充说明。
2. 调整 `src/types.ts` 中与势能展示相关的结构，必要时为 `LastAdvantage` 增加 `p2Breakdown`。
3. 修改 `src/engine/phases.ts`，在回合结束结算势能时同时保存双方 breakdown。
4. 复用 `src/engine/rules.ts` 的 `getAdvantageBreakdown()`，为 UI 提供实时势能预估数据。
5. 重构 `src/components/Card.tsx` 的使魔属性渲染逻辑，让手牌、换牌、场上使魔统一显示 `攻 / 血 / 威`。
6. 新增独立的势能面板组件，例如 `src/components/MomentumPanel.tsx`，把双方分项和总分展示拆出来单独维护。
7. 修改 `src/components/Board.tsx`，接入新的势能面板，并决定“当前预估”与“上次结算”在侧边栏里的排布关系。
8. 修改 `src/style.css`，补齐第三属性徽章和势能面板的布局、层级、响应式样式。
9. 补充或更新 `tests/engine.test.js`，至少覆盖：
   - 威胁值参与势能计算的已有规则没有被破坏。
   - 双方势能 breakdown 数据结构仍可正确生成。
10. 执行 `npm run build` 与 `npm test`，确认 `dist/` 与测试结果同步。
11. 改修完成后更新 `memory-bank/progress.md`；如果新增了组件并改变了组件职责，再同步更新 `memory-bank/architecture.md`。

## 关联修正检查

- `src/components/Card.tsx`
  - 需要确认手牌、Mulligan、场上使魔三种入口都走到同一套三属性渲染逻辑。
- `src/components/Board.tsx`
  - 需要确认旧的“优势值”摘要是否保留、替换，还是作为“上次结算”附属信息继续存在。
- `src/engine/phases.ts`
  - 需要确认 `lastAdvantage` 的赋值逻辑与日志文案没有因结构扩展而失效。
- `src/types.ts`
  - 需要确认 `LastAdvantage` 扩展后，所有读取该类型的调用方都同步调整。
- `tests/engine.test.js`
  - 需要补足新的 breakdown 结构断言，避免只改 UI 不验证底层数据。
- `src/style.css`
  - 需要确认新增第三枚属性徽章后，卡片在桌面端与移动端不会挤坏布局。
- `dist/`
  - 因为运行和测试依赖构建产物，最终实装时必须重新构建。
- 文档与规则一致性：
  - 本次改修本身不改变规则公式，但会把规则里已经存在的“威胁值 / 势能公式”更完整地显式化。
  - 若实际落地时把“优势值”统一改名为“势能”，需要检查 UI 文案和说明文档是否一并统一。

# Progress

## 用途

`memory-bank/progress.md` 用来记录项目已经发生过的重要修改，方便代理在动手前快速确认最近履历，避免重复判断或漏掉联动项。

## 记录模板

```md
## YYYY-MM-DD

### 主题
- 涉及文件：
- 本次改动：
- 验证：
- 关联修正检查：
```

## 2026-04-23

### 建立 memory-bank 与协作文档

- 涉及文件：
  - `memory-bank/`
  - `AGENT.md`
  - `SKILL.md`
- 本次改动：
  - 建立 `memory-bank` 目录
  - 新增项目结构与履历文档
  - 补充代理工作规则与内容更新准则
- 验证：
  - 文档创建与链接检查
- 关联修正检查：
  - 属于协作文档初始化，无需联动修改源码

### `project-structure.md` 改名为 `architecture.md`

- 涉及文件：
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
  - `AGENT.md`
- 本次改动：
  - 将 `project-structure.md` 统一改名为 `architecture.md`
  - 同步修正相关文档引用
- 验证：
  - 文档引用检查
- 关联修正检查：
  - 仅文档层联动，无需改业务代码

### 规则文档切换到 v1.2

- 涉及文件：
  - `design/game_rule.md`
  - `README.md`
  - `AGENT.md`
  - `memory-bank/architecture.md`
  - `src/App.tsx`
  - `dist/App.js`
- 本次改动：
  - 以 `design/new_rule.md` 为准更新规则主文档
  - 将项目内相关引用统一指向新的规则主文档
- 验证：
  - 构建通过
- 关联修正检查：
  - 主要是文档与引用修正，没有直接修改核心游戏逻辑

### `game_design` 按 `game_rule` 重写并补方案

- 涉及文件：
  - `design/game_design.md`
  - `design/game_design_update_plan.md`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- 本次改动：
  - 将 `game_design.md` 对齐到 v1.2 规则
  - 新增按 `SKILL.md` 编写的更新方案文档
- 验证：
  - 文档结构检查
- 关联修正检查：
  - 属于设计同步，无需联动修改源码

### v1.2 第一版规则实装

- 涉及文件：
  - `src/types.ts`
  - `src/data/characters.ts`
  - `src/data/talents.ts`
  - `src/data/decks.ts`
  - `src/engine/ai.ts`
  - `src/engine/gameState.ts`
  - `src/engine/phases.ts`
  - `src/engine/effects.ts`
  - `src/engine/slotResolver.ts`
  - `src/store/useGameStore.ts`
  - `src/App.tsx`
  - `src/components/`
  - `tests/engine.test.js`
- 本次改动：
  - 扩展阶段到 `draw / combat / turnEnd`
  - 角色从 A-C 扩展到 A-F
  - 卡组升级为 `50` 张主卡组 + `3` 张备牌库
  - 天赋升级为先后手动态定价与座位限制
  - 接入守护、磨牌、法术增伤、低费使魔冲锋、大招后保留槽位等第一版规则效果
- 验证：
  - `cmd /c npm run build`
  - `cmd /c npm test`
- 关联修正检查：
  - UI、引擎、测试均已同步到新规则结构

### 角色与技能模块化

- 涉及文件：
  - `src/data/characters.ts`
  - `src/data/characters/characterA.ts`
  - `src/data/characters/characterB.ts`
  - `src/data/characters/characterC.ts`
  - `src/data/characters/characterD.ts`
  - `src/data/characters/characterE.ts`
  - `src/data/characters/characterF.ts`
  - `memory-bank/architecture.md`
- 本次改动：
  - 将角色定义拆分到独立模块
  - 每个角色文件独立维护基础资料、被动与大招
  - `src/data/characters.ts` 保持聚合出口，避免影响现有调用方
- 验证：
  - `cmd /c npm run build`
  - `cmd /c npm test`
- 关联修正检查：
  - 因为根入口接口未变，其他业务模块无需改 import

### 卡牌与天赋模块化

- 涉及文件：
  - `src/data/cards.ts`
  - `src/data/cards/minions.ts`
  - `src/data/cards/spells.ts`
  - `src/data/cards/persistents.ts`
  - `src/data/cards/traps.ts`
  - `src/data/talents.ts`
  - `src/data/talents/survival.ts`
  - `src/data/talents/resource.ts`
  - `src/data/talents/deckControl.ts`
  - `src/data/talents/combat.ts`
  - `src/data/talents/spell.ts`
  - `src/data/talents/burst.ts`
  - `src/data/talents/slotControl.ts`
  - `memory-bank/architecture.md`
- 本次改动：
  - 将卡牌定义按 `minion / spell / persistent / trap` 拆分到独立模块
  - 将天赋定义按功能类别拆分到独立模块
  - 保留 `src/data/cards.ts` 与 `src/data/talents.ts` 作为对外聚合入口
  - 重写拆分文件内容，修复拆分过程中引入的语法问题
- 验证：
  - `cmd /c npm run build`
  - `cmd /c npm test`
- 关联修正检查：
  - `engine`、`store`、`tests` 与 UI 层继续通过根入口取数，因此无需联动修改 import

# Progress

## 2026-04-24

### Added SKILL sync rules for game design and game rule

- Files
  - `SKILL.md`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- Summary
  - Added a rule that content updates must also review and update `design/game_design.md`.
  - Added a rule that rule updates must also review and update `design/game_rule.md`.
- Verification
  - Document update only; no build or tests run.
- Related updates checked
  - Confirmed the repo currently maintains `design/game_design.md` and `design/game_rule.md` as the active design and rule documents.

### Added AGENT rule to force SKILL usage on content tasks

- Files
  - `AGENT.md`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- Summary
  - Added an explicit agent rule requiring `SKILL.md` to be read before content-update, design-sync, rule-document, and catalog-maintenance tasks.
  - Added a matching rule that minion changes must keep the minion catalog document synchronized.
- Verification
  - Document update only; no build or tests run.
- Related updates checked
  - Confirmed `SKILL.md` remains the repo's content-update workflow document and `design/minion_codex.md` remains the current minion catalog file.

### Updated SKILL minion-doc sync rule

- Files
  - `SKILL.md`
  - `memory-bank/progress.md`
- Summary
  - Added a rule that whenever minions are modified or new minions are added, the minion catalog document must also be updated.
  - The rule explicitly treats `design/minion.md` as the default target and falls back to `design/minion_codex.md` when that is the file currently maintained in the repo.
- Verification
  - Document update only; no build or tests run.
- Related updates checked
  - Confirmed the current repo still uses `design/minion_codex.md` as the existing minion catalog file.

### Modularized minion data files

- Files
  - `src/data/cards/minions.ts`
  - `src/data/cards/minions/lowCost.ts`
  - `src/data/cards/minions/midCost.ts`
  - `src/data/cards/minions/highCost.ts`
  - `src/data/cards/minions/guardPackage.ts`
  - `memory-bank/architecture.md`
- Summary
  - Split minion definitions out of the single `minions.ts` file into grouped submodules.
  - Kept `src/data/cards/minions.ts` as the stable aggregation export so upstream imports do not need to change.
- Verification
  - `cmd /c npm test`
- Related updates checked
  - Verified that `src/data/cards.ts` can continue importing `MINION_CARDS` from the same path without any changes in engine, UI, or tests.

### Added the guard minion package and catalog

- Files
  - `src/data/cards/minions.ts`
  - `src/engine/effects.ts`
  - `src/engine/rules.ts`
  - `tests/engine.test.js`
  - `design/minion_codex.md`
  - `memory-bank/architecture.md`
- Summary
  - Added seven new minions centered on guard mechanics.
  - Added runtime support for `onAttacked`, token generation to hand, adjacent-guard spreading, low-hp self buffing, menace threat suppression, and magic-resistant targeting.
  - Added a minion catalog markdown file under `design/`.
- Verification
  - `cmd /c npm run build`
  - `cmd /c npm test`
- Related updates checked
  - Added engine tests for the new mechanics and kept the momentum calculation in sync with the new `menace` rule.

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

### 攻击撞击特效

- 涉及文件：
  - `src/store/useGameStore.ts`
  - `src/components/Board.tsx`
  - `src/components/Card.tsx`
  - `src/components/PlayerHUD.tsx`
  - `src/App.tsx`
  - `src/style.css`
  - `memory-bank/architecture.md`
- 本次改动：
  - 在 `uiState` 中加入 `attackFx`，用于描述当前攻击动画的攻击方与受击方
  - 玩家手动攻击时改为先播放短暂前冲与命中抖动，再执行实际攻击结算
  - 敌方英雄与使魔都可以作为命中特效目标
  - 保持规则层无感知，攻击特效不进入 `GameState`
- 验证：
  - `cmd /c npm run build`
  - `cmd /c npm test`
- 关联修正检查：
  - 这次只改了 UI / store 表现层与样式，没有修改引擎攻击规则
  - 当前版本优先覆盖玩家手动攻击，AI 连续攻击演出仍可在后续单独扩展

### 根目录一键启动文件

- 涉及文件：
  - `start-game.bat`
  - `start-game.ps1`
  - `memory-bank/architecture.md`
- 本次改动：
  - 在根目录新增 Windows 用的一键启动脚本
  - 批处理文件改为调用 PowerShell 启动器
  - 启动器会检查 `npm`、按需执行 `npm install`、再启动 `npm start`
  - 使用独立的 Edge / Chrome / Brave 应用窗口打开游戏
  - 关闭该游戏窗口后，自动结束服务器进程树
- 验证：
  - 脚本内容检查
- 关联修正检查：
  - 不影响游戏源码与规则逻辑

### README 重写

- 涉及文件：
  - `README.md`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- 本次改动：
  - 将 README 重写为干净的中文版
  - 同步当前项目状态、目录结构、模块化数据布局与启动方式
  - 补充 `start-game.bat / start-game.ps1` 的使用说明
- 验证：
  - 文档内容检查
- 关联修正检查：
  - 属于说明文档更新，不影响源码与规则逻辑

### 启动器报错定位与 TypeScript 依赖补全

- 涉及文件：
  - `package.json`
  - `start-game.ps1`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- 本次改动：
  - 为项目补上 `typescript` 开发依赖，避免干净环境执行 `npm start` 时缺少 `tsc`
  - 增强 `start-game.ps1` 的错误输出，在服务提前退出时打印 `npm start` 的 stdout/stderr
  - 启动器改为同时检查 `node_modules` 与本地 `tsc`，缺任一项都会自动重新安装依赖
- 验证：
  - 启动器脚本语法检查
  - 本地 `npm start / npm test` 仍可运行
- 关联修正检查：
  - 只影响启动与开发环境，不修改游戏规则或 UI 行为

### 自动更新启动器

- 涉及文件：
  - `update-and-start.bat`
  - `start-game.ps1`
  - `README.md`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- 本次改动：
  - 新增 `update-and-start.bat`，用于先更新再启动游戏
  - 为 `start-game.ps1` 加入 `-AutoUpdate` 参数，支持从 `origin` 拉取当前分支最新代码
  - 自动更新只在工作区干净时执行，并固定使用 `git pull --ff-only`，避免隐式合并或覆盖本地改动
  - README 与 memory-bank 同步补充自动更新启动方式和安全边界说明
- 验证：
  - 启动器脚本语法检查
- 关联修正检查：
  - 这次只影响启动脚本与文档，不涉及游戏规则、UI 与测试逻辑

### 补充 Git 忽略规则

- 涉及文件：
  - `.gitignore`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- 本次改动：
  - 在仓库根目录新增 `.gitignore`
  - 明确忽略 `node_modules/`，避免将本地依赖目录误作为提交或 push 对象
- 验证：
  - `git check-ignore -v node_modules`
  - `git status --short --untracked-files=all`
- 关联修正检查：
  - 只影响版本控制范围，不修改游戏逻辑、UI、构建或测试代码

### 使魔威胁值与势能面板改修计划

- 涉及文件：
  - `SKILL.md`
  - `design/threat_and_momentum_update_plan.md`
  - `memory-bank/progress.md`
- 本次改动：
  - 按 `SKILL.md` 的固定顺序整理“使魔威胁值可视化 + 双方势能面板”的改修计划
  - 明确当前问题主要是 UI 缺少展示，而不是规则层缺少威胁值或势能计算
  - 将后续实装范围拆到组件、类型、规则记录、样式和测试层
- 验证：
  - 文档内容检查
  - 相关代码位置核对
- 关联修正检查：
  - 本次仅新增计划文档，尚未修改业务代码与构建产物

### 使魔威胁值可视化与双方势能面板实装

- 涉及文件：
  - `src/components/Card.tsx`
  - `src/components/Board.tsx`
  - `src/components/MomentumPanel.tsx`
  - `src/style.css`
  - `tests/engine.test.js`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- 本次改动：
  - 让手牌、换牌区、战场上的使魔统一显示 `攻击力 / 血量 / 威胁值`
  - 新增独立的 `MomentumPanel.tsx`，实时展示玩家与 AI 的手牌分、血量分、威胁值分、特殊扣分和总势能分
  - 势能面板同时保留“上次结算”的 `V` 值与槽位收益，方便把实时局面和正式结算结果对照起来
  - 补充样式，使三属性徽章和双方势能面板在桌面端与窄屏布局下都能正常显示
  - 新增一条针对 `getAdvantageBreakdown()` 分项结果的测试，锁住势能分项结构
- 验证：
  - `cmd /c npm run build`
  - `cmd /c npm test`
- 关联修正检查：
  - `Board.tsx` 已从旧的简化“优势值”卡切换到新的势能面板
  - `Card.tsx` 的三属性渲染已覆盖手牌、换牌与战场三个使魔入口
  - `dist/` 已通过构建同步更新

## 2026-04-24

### 卡牌演出特效实装

- 涉及文件：
  - `src/store/useGameStore.ts`
  - `src/engine/phases.ts`
  - `src/engine/gameState.ts`
  - `src/components/Board.tsx`
  - `src/components/Card.tsx`
  - `src/components/EffectLayer.tsx`
  - `src/style.css`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- 本次改动：
  - 为召唤使魔、放置持续物、盖伏陷阱加入入场和落位特效
  - 为法术发动与陷阱触发加入统一的中央效果横幅
  - 在 `useGameStore.ts` 中新增基于前后状态差分的 `cardFx` / `cardFxQueue`，统一驱动玩家与 AI 的卡牌演出
  - AI 回合从整段同步执行改为逐动作推进，让出牌和效果可以逐步显示
- 验证：
  - `cmd /c npm run build`
  - `cmd /c npm test`
- 关联修正检查：
  - `Board.tsx` 已接入新的 `EffectLayer` 和区域高亮
  - `Card.tsx` 已为使魔和持续物 / 陷阱卡补入场类名与卡面演出
  - `dist/` 已通过构建同步更新

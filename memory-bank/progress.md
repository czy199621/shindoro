# Progress

## 2026-04-25

### 公共备牌库终结者与大魔法实装

- 涉及文件：
  - `src/types.ts`
  - `src/data/decks.ts`
  - `src/data/cards/minions.ts`
  - `src/data/cards/minions/sideboardFinishers.ts`
  - `src/data/cards/spells.ts`
  - `src/engine/effects.ts`
  - `src/engine/phases.ts`
  - `src/engine/slotResolver.ts`
  - `tests/engine.test.js`
  - `design/update.md`
  - `design/game_rule.md`
  - `design/game_design.md`
  - `design/minion.md`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- 本次改动：
  - 根据 `design/update_design.md` 接入 4 张公共 13 点神抽终结者和 6 张大魔法。
  - 每名角色的备牌库统一改为公共终结者集合。
  - 新增额外回合、失败败北、肃清、磨牌到 7 张、生命互换、双槽封锁、清场、拆除持续魔法、拆除触发魔法和下回合费用减半等效果。
  - 补充吸血、必杀、潜行指定限制、连击攻击次数和回复关键词的基础规则处理。
  - 补全 `design/update.md` 中被截断的“看破”说明，并同步规则、设计和使魔图鉴。
- 验证：
  - `npm.cmd test`
- 关联修正检查：
  - 已同步规则文档、设计文档、使魔图鉴、架构记忆和引擎测试。
  - 尚未为大魔法建立独立法术图鉴；当前由 `game_rule.md` 与 `game_design.md` 承载说明。

## 2026-04-24

### Added archive-based auto-update fallback for non-Git installs

- Files
  - `start-game.ps1`
  - `update-source.json`
  - `.gitignore`
  - `README.md`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- Summary
  - Kept Git-based fast-forward update as the first choice for developer worktrees.
  - Added a no-Git fallback path that downloads the latest GitHub branch zip, applies managed files into the current folder, and records a local update state file with commit and file hashes.
  - Added local-change protection for archive-updated installs so post-update edits can cause auto-update to skip instead of silently overwriting files.
- Verification
  - PowerShell script syntax parse
- Related updates checked
  - Updated the user-facing README and architecture notes so the new update flow is documented alongside the existing launch workflow.

### Removed the empty-state settlement hint box

- Files
  - `src/components/MomentumPanel.tsx`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- Summary
  - Removed the default settlement hint box that appeared in the momentum panel before any actual settlement result existed.
  - The settlement area now renders only when `lastAdvantage` is available.
- Verification
  - `cmd /c npm run build`
- Related updates checked
  - Kept the real `上次结算` block unchanged, so only the no-data placeholder was removed.

### Moved restart control into the hand toolbar

- Files
  - `src/components/Board.tsx`
  - `src/style.css`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- Summary
  - Moved the `重新开始` button out of the header log card and into the hand-zone toolbar, placing it to the left of `取消攻击选择`.
  - Simplified the header log card again so it now renders only the scrollable log content.
- Verification
  - `cmd /c npm run build`
- Related updates checked
  - Kept the hand toolbar order explicit in markup so the restart control stays left of cancel-attack on the current desktop layout.

### Slimmed down the header log card

- Files
  - `src/components/Board.tsx`
  - `src/style.css`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- Summary
  - Removed the header log title and left only a compact restart control above the log entries.
  - Reduced the header log card padding, visible log height, button size, and log item density so the card sits flatter inside the header.
- Verification
  - `cmd /c npm run build`
- Related updates checked
  - Kept the full log content and scroll behavior intact while only compressing the header log presentation.

### Moved the battle log into the header right side

- Files
  - `src/components/Board.tsx`
  - `src/style.css`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- Summary
  - Moved the battle log out of the right sidebar and into the right side of the in-match header.
  - Added a dedicated `hero-log-card` layout so the header now reads as left status, center match info, and right log.
- Verification
  - `cmd /c npm run build`
- Related updates checked
  - Kept a narrow-screen fallback so the header log can wrap beneath the other header content instead of breaking the layout.

### Removed extra explanatory copy from battle UI panels

- Files
  - `src/components/Board.tsx`
  - `src/components/MomentumPanel.tsx`
  - `src/components/PlayerHUD.tsx`
  - `src/components/SlotMeter.tsx`
  - `src/style.css`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- Summary
  - Removed the descriptive subtitle from the momentum panel header.
  - Removed the explanatory text from jump-slot and god-draw-slot badges.
  - Removed the separate slot-tip sidebar card so the right sidebar now stays focused on momentum and battle log content.
- Verification
  - `cmd /c npm run build`
- Related updates checked
  - Adjusted the desktop sidebar row sizing after removing the slot-tip card so the remaining panels still fill the area cleanly.

### Moved battle info into the header center area

- Files
  - `src/components/Board.tsx`
  - `src/style.css`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- Summary
  - Split the in-match header into a left title/status block and a centered battle-info strip so turn, current actor, phase, and attack state no longer sit at the far right.
  - Added a desktop-only three-column hero grid and kept the smaller-screen fallback so the centered info strip collapses cleanly on narrower layouts.
- Verification
  - `cmd /c npm run build`
- Related updates checked
  - Limited the change to the in-match header layout and kept the rest of the battlefield, sidebar, and mobile fallback structure unchanged.

### Tightened the HUD resource and slot badges

- Files
  - `src/components/SlotMeter.tsx`
  - `src/style.css`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- Summary
  - Reduced the desktop HUD HP and Mana label sizing and tightened the resource badge spacing so the label text stays fully contained within the badge.
  - Added dedicated slot badge classes and compressed the slot card header, counter, and note text so jump-slot and god-draw-slot cards fit more cleanly inside player info panels.
- Verification
  - `cmd /c npm run build`
- Related updates checked
  - Kept the adjustment scoped to the in-match HUD layout and slot meter component, without changing rules or other card panel structures.

### Rebalanced the desktop UI around information readability

- Files
  - `src/style.css`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- Summary
  - Changed battle rows to keep cards at readable fixed widths and use internal horizontal scrolling instead of shrinking cards until descriptions become cramped.
  - Stacked the momentum panel vertically and turned the HUD passive description into a dedicated readable block so dense sidebar and HUD information can be read more naturally.
- Verification
  - `cmd /c npm run build`
- Related updates checked
  - Kept the smaller-screen fallback rules intact, so these readability-focused desktop adjustments stay scoped to the in-match desktop layout.

### Expanded the in-match UI to use more monitor width

- Files
  - `src/style.css`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- Summary
  - Removed the fixed maximum width from `.game-shell` so the in-match screen can stretch closer to the full monitor width.
  - Switched the sidebar, HUD columns, and desktop card widths to `clamp(...)` sizing so large screens use extra width more naturally.
- Verification
  - `cmd /c npm run build`
- Related updates checked
  - Kept the smaller-screen fallback in the existing `@media (max-width: 1180px)` block so this wider desktop behavior does not leak into narrow layouts.

### Reworked the battle UI for desktop screens

- Files
  - `src/components/Board.tsx`
  - `src/style.css`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- Summary
  - Reorganized the game board into two horizontal battlefield halves with a dedicated compact hand zone so the main match view uses monitor width more effectively.
  - Added `.game-shell` desktop-only layout rules that keep the battle screen inside the viewport and move overflow into internal panels like the battle log.
- Verification
  - `cmd /c npm run build`
- Related updates checked
  - Scoped the new layout rules to the in-match screen so setup and mulligan screens keep their previous responsive layout behavior.

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

## 2026-04-25

### Vite + React + TypeScript + PixiJS 第一阶段迁移

- 涉及文件：
  - `package.json`
  - `package-lock.json`
  - `index.html`
  - `tsconfig.json`
  - `tsconfig.test.json`
  - `vite.config.ts`
  - `src/main.tsx`
  - `src/App.tsx`
  - `src/style.css`
  - `src/game-view/pixi/PixiBattlefieldHost.tsx`
  - `tests/engine.test.js`
  - `deploy-aws.ps1`
  - `AWS_DEPLOY.md`
  - `.gitignore`

- 本次改动：
  - 项目入口从 `src/main.ts` + 原生 DOM mount 迁移到 `src/main.tsx` + React `createRoot()`。
  - `src/App.tsx` 改成 React 根组件，但暂时保留旧字符串模板渲染层，避免一次性重写 UI 导致玩法回归风险。
  - 新增 PixiJS 依赖和 `PixiBattlefieldHost`，作为后续 Canvas/WebGL 战场层挂载点。
  - PixiJS 采用 `React.lazy()` 按需加载，只在进入对战画面时加载。
  - 引擎层和数据层保持现有结构，`src/engine/` 与 `src/data/` 没有因前端迁移被重写。
  - 测试构建输出从 `dist/` 改为 `.test-dist/`，避免和 Vite 网站产物冲突。
  - `dist/` 现在改为 Vite 正式静态站点产物。
  - AWS 部署脚本改为上传 Vite `dist/` 目录内容，而不是上传旧的 `index.html + dist + src/style.css` 结构。

- 验证：
  - `npm.cmd install` 成功，新增 React、React DOM、Vite、PixiJS 相关依赖。
  - `npm.cmd test` 通过，`27/27`。
  - `npm.cmd run build` 通过，Vite 生成 `dist/index.html` 与 `dist/assets/*`。
  - `deploy-aws.ps1 -DryRun -SkipTests` 通过，会上传 Vite assets，并删除 S3 上旧的 `/dist/*` 与 `/src/style.css` 文件。
  - 本地 Vite dev server 已验证可访问：`http://localhost:4173/` 返回 `200`。

- 注意事项：
  - PowerShell 中直接执行 `.\deploy-aws.ps1` 可能被执行策略拦截，推荐继续使用 `npm.cmd run deploy:aws` 或 `deploy-aws.bat`。
  - Vite 在沙箱环境里可能出现 `spawn EPERM`，实际本机权限运行 `npm.cmd run build` 可以通过。
  - 当前 PixiJS 只是架构挂载点，尚未真正接管卡牌、战场、攻击轨迹和粒子表现。
  - 下一步建议先把旧字符串模板逐步拆成 React 组件，再将战场表现迁移到 PixiJS。

### Kapipara AI 天赋约束与 AWS 部署补充记录

- Kapi AI 已强制拿：
  - `wide_grip`：手牌上限 +2
  - `vitality_ritual`：最大生命 +6
- 已新增测试保护该规则，避免未来 AI 调整时丢失。
- 当前 AWS 线上地址：
  - `https://d2j3zgbvkaujmi.cloudfront.net/`
- CloudFront 默认根对象已修正为 `index.html`。
- 正确 Distribution ID 是 `E3JF5ILT0KVD5W`，其中中间字符是数字 `0`，不是字母 `O`。


### React battle board, Pixi effects, and card inspection tooltip

- Files
  - `src/components/react/CardView.tsx`
  - `src/components/react/PlayerHUDView.tsx`
  - `src/components/react/ReactBattleBoard.tsx`
  - `src/game-view/pixi/PixiBattlefieldHost.tsx`
  - `src/App.tsx`
  - `src/style.css`
  - `memory-bank/2026-04-25-react-board-pixi.md`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- Summary
  - Replaced the battle screen's old `renderBoard()` string-template path with real React components while keeping setup and mulligan on the legacy compatibility path.
  - Added React card, minion, persistent/trap, player HUD, battle board, pending choice, game-over, battle log, and momentum panel composition.
  - Kept PixiJS as a display-only foreground effects layer for attack trails, damage numbers, hit bursts, summon particles, and spell/trap/persistent bursts.
  - Removed the temporary Pixi battlefield underlay; Pixi now creates only the fixed `pixi-battlefield-effects` canvas with `pointer-events: none`.
  - Added DOM coordinate mapping through `data-pixi-entity-id` so Pixi effects align to real React cards and HUDs.
  - Tightened battle layout rows, sidebar, card heights, text clamping, and internal overflow so the board stays readable during play.
  - Added a unified hover/focus card-detail tooltip for hand cards, board minions, persistents, and traps, including support for currently unplayable hand cards.
- Verification
  - `npm.cmd run build`
  - `npm.cmd test` passed: 27/27
  - Local Vite server returned HTTP 200
- Related updates checked
  - Summarized the daily implementation note from `memory-bank/2026-04-25-react-board-pixi.md` into the long-term architecture and progress records.

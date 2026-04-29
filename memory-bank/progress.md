# Progress

## 2026-04-29

### 战场标题隐藏、手牌居中与中心展开召唤
- 影响文件：
  - `src/components/react/ReactBattleBoard.tsx`
  - `src/components/Board.tsx`
  - `src/style.css`
  - `dist/`
  - `memory-bank/progress.md`
  - `memory-bank/architecture.md`
- 本次改动：
  - 隐藏敌我中央前场的“敌方战场 / 你的战场”标题文字，只保留计数信息。
  - 我方手牌改为与敌方手牌一致的居中展示，并保留 HUD 安全区。
  - 随从槽显示改为中间优先：第 1 个随从显示在 7 格中央，之后按左、右、再左、再右逐渐向两边展开。
  - 该顺序只影响 UI 视觉槽位；规则层 `player.board` 仍保持紧凑数组，避免影响攻击、AI 与已有测试。
- 验证：
  - `npm.cmd run build` 通过，并同步生成新版 `dist/`。
  - `npm.cmd run test` 通过（49/49）。

### 召唤特效层不再挤压战斗布局
- 影响文件：
  - `src/style.css`
  - `dist/`
  - `memory-bank/progress.md`
  - `memory-bank/architecture.md`
- 本次改动：
  - 定位召唤随从时战场和手牌被横向挤压的原因：`board-shell > .effect-layer` 被后续高优先级规则改成了 `position: relative`，导致 `cardFx` 挂载时作为 flex 子项占据宽度。
  - 在最终覆盖层将 `effect-layer` 和 `turn-seal` 恢复为绝对定位浮层，确保召唤、放置、法术和陷阱提示不会参与 `board-shell` 的 flex 布局计算。
- 验证：
  - `npm.cmd run build` 通过，并同步生成新版 `dist/`。
  - `npm.cmd run test` 通过（49/49）。

### 手牌边界与 HUD 安全区修正
- 影响文件：
  - `src/style.css`
  - `dist/`
  - `memory-bank/progress.md`
  - `memory-bank/architecture.md`
- 本次改动：
  - 修正图片式卡框变高后，底部手牌行仍沿用旧高度，导致卡牌上缘被裁切 / 被桌面视觉层压住的问题。
  - 恢复并收敛手牌右侧 HUD 安全区，避免右下玩家 HUD 遮住最右侧手牌。
  - 提高手牌区层级与纵向可见空间；矮屏桌面端会适当缩小手牌卡，优先保证完整可见。
- 验证：
  - `npm.cmd run build` 通过，并同步生成新版 `dist/`。
  - `npm.cmd run test` 通过（49/49）。

### 敌方后场挂入敌方 HUD 栈
- 影响文件：
  - `src/components/react/ReactBattleBoard.tsx`
  - `src/components/Board.tsx`
  - `src/style.css`
  - `dist/`
  - `memory-bank/progress.md`
  - `memory-bank/architecture.md`
- 本次改动：
  - 将敌方后场从 `battle-main` 中移出，直接渲染到 `.enemy-hud-corner` 内，位于敌方 HUD 下方。
  - 敌方后场现在与敌方 HUD 共用同一个角落定位容器，天然使用同一左边缘基准，不再受 `battle-main` 响应式 grid 分支影响。
  - 保留后场 2x4 紧凑矩阵与敌方盖伏隐藏规则；旧字符串模板 `Board.tsx` 同步相同结构。
  - 前一次“桌面端在 battle-main 内绝对定位”的方案仅能覆盖宽屏，已由 HUD 栈内渲染替代。
- 验证：
  - `npm.cmd run build` 通过，并同步生成新版 `dist/`。
  - `npm.cmd run test` 通过（49/49）。

### 敌方后场改为桌面端边缘锚定
- 影响文件：
  - `src/style.css`
  - `dist/`
  - `memory-bank/progress.md`
  - `memory-bank/architecture.md`
- 本次改动：
  - 修正敌方后场仍然没有跟敌方 HUD 左边缘对齐的问题。
  - 原因是敌方后场仍参与 `battle-main` 的 `enemySide` 网格区域布局，`margin-left` 只相对网格列生效，不是相对棋盘边缘 / HUD 生效。
  - 桌面端将 `.enemy-backrow-zone` 改为在 `.battle-main` 内绝对定位，并直接使用 `--enemy-hud-gap` 作为 `left`，确保和敌方 HUD 左边缘使用同一定位基准。
- 验证：
  - `npm.cmd run build` 通过，并同步生成新版 `dist/`。
  - `npm.cmd run test` 通过（49/49）。

### 敌方后场对齐与结束回合按钮归位
- 影响文件：
  - `src/components/react/ReactBattleBoard.tsx`
  - `src/components/Board.tsx`
  - `src/style.css`
  - `dist/`
  - `memory-bank/progress.md`
  - `memory-bank/architecture.md`
- 本次改动：
  - 敌方后场左边缘改为跟敌方 HUD 左边缘对齐，避免左侧视觉基准漂移。
  - “结束回合”从右上日志控制组移出，改为固定在我方后场面板下方。
  - 右上战斗控制组现在只保留“重新开始”和“取消攻击选择”。
  - 旧字符串模板 `Board.tsx` 同步移动 `data-action="end-turn"`，保持兼容路径可点击。
- 验证：
  - `npm.cmd run build` 通过，并同步生成新版 `dist/`。
  - `npm.cmd run test` 通过（49/49）。

### 战斗布局精修：HUD、空槽和敌方手牌
- 影响文件：
  - `src/style.css`
  - `dist/`
  - `memory-bank/progress.md`
  - `memory-bank/architecture.md`
- 本次改动：
  - 敌方 HUD 改为和我方一样保留棋盘边距，不再贴到视口边缘。
  - 左右后场面板分别向敌方 / 我方 HUD 靠近，保持紧凑但避免长期占用中央战场空间。
  - 敌方战场与我方战场的 `field-zone` 底框改为透明，中央区域只保留实际卡牌和显现后的槽位。
  - 随从槽与后场槽在空槽时隐藏边框、背景、编号和标签；只有有卡牌占用时才显现。
  - 敌方手牌卡背放大到接近我方手牌尺寸，并隐藏“敌方手牌”标题与数量牌。
- 验证：
  - `npm.cmd run build` 通过，并同步生成新版 `dist/`。
  - `npm.cmd run test` 通过（49/49）。

### 战斗操作按钮移到日志下方竖排
- 影响文件：
  - `src/components/react/ReactBattleBoard.tsx`
  - `src/components/Board.tsx`
  - `src/style.css`
  - `dist/`
  - `memory-bank/progress.md`
  - `memory-bank/architecture.md`
- 本次改动：
  - 将“重新开始 / 取消攻击选择 / 结束回合”从手牌区移出。
  - 新增右上 `battle-control-dock`，战斗日志入口在顶部，操作按钮在其下方竖排放置。
  - React 战斗界面与旧字符串模板 `Board.tsx` 同步同一结构，避免兼容路径仍在手牌区显示按钮。
  - 手牌区现在只保留手牌本身，减少底部拥挤和按钮遮挡卡牌的风险。
- 验证：
  - `npm.cmd run build` 通过，并同步生成新版 `dist/`。
  - `npm.cmd run test` 通过（49/49）。

### 后场紧凑 2x4 矩阵
- 影响文件：
  - `src/components/react/ReactBattleBoard.tsx`
  - `src/components/Board.tsx`
  - `src/style.css`
  - `dist/`
  - `memory-bank/progress.md`
  - `memory-bank/architecture.md`
- 本次改动：
  - 左右后场从单列 7 格改为 2 列 x 4 行紧凑矩阵。
  - 矩阵第一格用于显示“敌方/我方 x/7”计数，其余 7 格为持续物 + 陷阱共享后场槽。
  - 缩短后场面板高度并居中摆放，减少与左上敌方 HUD、右下玩家 HUD 的重叠风险。
  - 旧字符串模板 `Board.tsx` 同步相同结构，兼容路径不会回到单列后场。
- 验证：
  - `npm.cmd run build` 通过，并同步生成新版 `dist/`。
  - `npm.cmd run test` 通过（49/49）。

### 标注图战斗区重排：中央前场、左右后场
- 影响文件：
  - `src/components/react/ReactBattleBoard.tsx`
  - `src/components/Board.tsx`
  - `src/style.css`
  - `dist/`
  - `memory-bank/progress.md`
  - `memory-bank/architecture.md`
- 本次改动：
  - 按用户标注图重新规划战斗区：敌方 HUD 保持左上，玩家 HUD 保持右下。
  - 敌方手牌固定在中央顶部；中央区域只承载敌方前场和我方前场，前场随从槽保持 7 格。
  - 敌方后场从中央战场抽到左侧纵向侧栏；我方后场抽到右侧纵向侧栏；两侧后场都使用持续物 + 陷阱共享 7 格。
  - 中央战场隐藏原先内嵌的共享后场行，避免后场重复占用前场空间；旧字符串模板 `Board.tsx` 同步侧栏后场结构。
- 验证：
  - `npm.cmd run build` 通过，并同步生成新版 `dist/`。
  - `npm.cmd run test` 通过（49/49）。

### 敌方伏牌手牌与等尺寸战场槽位
- 影响文件：
  - `src/components/react/ReactBattleBoard.tsx`
  - `src/components/Board.tsx`
  - `src/style.css`
  - `dist/`
  - `memory-bank/progress.md`
  - `memory-bank/architecture.md`
- 本次改动：
  - 敌方增加顶部手牌带，按敌方手牌数量显示伏牌卡背，不暴露卡名、费用和效果。
  - 战斗主区域改为四行：敌方手牌、敌方战场、我方战场、我方手牌。
  - 因敌方手牌占用纵向空间，双方战场槽位统一缩小；敌方与我方的随从槽、后场槽使用同一套尺寸规则。
  - 旧字符串模板 `Board.tsx` 同步渲染敌方伏牌手牌，保持兼容路径一致。
- 验证：
  - `npm.cmd run build` 通过，并同步生成新版 `dist/`。
  - `npm.cmd run test` 通过（49/49）。

### Figma 战场区 V2 落回代码
- 影响文件：
  - `src/components/react/ReactBattleBoard.tsx`
  - `src/components/Board.tsx`
  - `src/style.css`
  - `dist/`
  - `memory-bank/progress.md`
  - `memory-bank/architecture.md`
- 本次改动：
  - 将 Figma 稿 `ShinDoro 战场区 V2 - 7 随从 + 7 共享后场` 的核心结构落回战斗界面。
  - React 战场区新增固定槽位渲染：随从行固定 7 格，后场行固定 7 格。
  - 持续物和陷阱合并显示在共享后场行；玩家陷阱可检视，敌方陷阱只显示盖伏占位，不暴露卡名和效果。
  - 旧字符串模板 `Board.tsx` 同步渲染固定槽位，避免兼容路径仍使用旧的持续物/陷阱分行结构。
  - CSS 新增 `.battlefield-v2`、`.slot-lane`、`.battlefield-slot`、`.backrow-secret-card`，并隐藏旧的非槽位战场行。
- 验证：
  - `npm.cmd run build` 通过，并同步生成新版 `dist/`。
  - `npm.cmd run test` 通过（49/49）。

### 战场区域上限改为随从 7、共享后场 7
- 影响文件：
  - `src/engine/rules.ts`
  - `src/engine/effects.ts`
  - `src/engine/ai.ts`
  - `src/components/react/ReactBattleBoard.tsx`
  - `src/components/Board.tsx`
  - `tests/engine.test.js`
  - `design/game_rule.md`
  - `design/game_design.md`
  - `dist/`
  - `memory-bank/progress.md`
  - `memory-bank/architecture.md`
- 本次改动：
  - 随从区上限改为 `MAX_MINION_SLOTS = 7`。
  - 持续物与陷阱改为共享后场容量 `MAX_BACKROW_SLOTS = 7`，通过 `getBackrowSlotCount()` 统一计算。
  - 出牌、召唤、AI 评估和手牌禁用提示都改为读取统一规则；后场满时持续物和陷阱都会被禁止打出。
  - 战场计数 UI 改为显示 `随从 x/7` 与 `后场 x/7`，盖伏数量作为后场细分信息显示。
- 验证：
  - `npm.cmd run build` 通过，并同步生成新版 `dist/`。
  - `npm.cmd run test` 通过（49/49）。

### 战场区域上限统一为 6
- 影响文件：
  - `src/engine/rules.ts`
  - `src/engine/effects.ts`
  - `src/engine/ai.ts`
  - `src/components/react/ReactBattleBoard.tsx`
  - `src/components/Board.tsx`
  - `src/style.css`
  - `tests/engine.test.js`
  - `design/game_rule.md`
  - `design/game_design.md`
  - `dist/`
  - `memory-bank/progress.md`
  - `memory-bank/architecture.md`
- 本次改动：
  - 新增场上区域上限常量：随从 6、持续物 6、陷阱 6。
  - `canPlayCardForPlayer()` 统一检查三类战场槽位；持续物和陷阱满区时不再能继续打出。
  - 召唤随从的硬上限从 7 改为 6，并把满区日志改为“随从区已满”。
  - React 手牌禁用提示细分为“随从区已满 / 持续物区已满 / 陷阱区已满”，战场计数改为显示 `随从/持续/盖伏 x/6`。
  - AI 评估与旧版模板同步使用新上限，避免 AI 尝试打出已满区域的卡牌。
- 验证：
  - `npm.cmd run build` 通过，并同步生成新版 `dist/`。
  - `npm.cmd run test` 通过（49/49）。

### 角落 HUD 与无框手牌带
- 影响文件：
  - `src/components/react/ReactBattleBoard.tsx`
  - `src/components/Board.tsx`
  - `src/style.css`
  - `dist/`
  - `memory-bank/progress.md`
  - `memory-bank/architecture.md`
- 本次改动：
  - 将敌方人物信息从战场行内移到棋盘左上角，将玩家人物信息移到棋盘右下角。
  - 角落 HUD 改由 `board-shell` 直接定位；敌方 HUD 轻微压住内框，并缩小敌方战场左侧避让，减少左侧空带。
  - 手牌区去掉 `zone` 底框和“你的手牌”标题，改为贴近右下玩家 HUD 的无框手牌带。
  - 手牌工具按钮保留在手牌带上方，不再依赖原来的手牌标题栏。
- 验证：
  - `npm.cmd run build` 通过，并同步生成新版 `dist/`。
  - `npm.cmd run test` 通过（48/48）。

### 势能并入 HUD 与日志抽屉
- 影响文件：
  - `src/components/react/ReactBattleBoard.tsx`
  - `src/components/react/PlayerHUDView.tsx`
  - `src/components/Board.tsx`
  - `src/components/PlayerHUD.tsx`
  - `src/components/MomentumPanel.tsx`
  - `src/style.css`
  - `dist/`
  - `memory-bank/progress.md`
  - `memory-bank/architecture.md`
- 本次改动：
  - 移除战斗界面常驻右侧势能面板，玩家与敌方的势能总分及手/血/威/特分项改由各自 HUD 内部展示。
  - 战斗日志改为右侧悬浮 `details.battle-log-drawer`，默认收起，只保留一个可展开的日志入口，展开时覆盖在战场右侧查看。
  - 主战斗布局从“战场 + 固定侧栏”改回单列战场，避免右侧面板挤压场地和手牌。
- 验证：
  - `npm.cmd run build` 通过，并同步生成新版 `dist/`。
  - `npm.cmd run test` 通过（48/48）。

### 战斗界面移除 Header
- 影响文件：
  - `src/components/react/ReactBattleBoard.tsx`
  - `src/components/Board.tsx`
  - `src/style.css`
  - `dist/`
  - `memory-bank/progress.md`
  - `memory-bank/architecture.md`
- 本次改动：
  - 移除对局顶部 `game-hero` header，不再显示标题、Moe Arcana 徽标、回合/阶段信息条和当前建议条。
  - React 战斗界面与旧字符串模板都同步移除 header，避免兼容路径残留旧布局。
  - `game-shell` 改为单行战斗布局，`board-shell` 直接占满整个战斗视口，为后续大幅重构棋盘区域留空间。
- 验证：
  - `npm.cmd run build` 通过，并同步生成新版 `dist/`。

### 卡牌底框图片第一版
- 影响文件：
  - `src/style.css`
  - `public/card-frames/README.md`
  - `public/card-frames/common/frame.png`
  - `public/card-frames/minion/frame.png`
  - `public/card-frames/spell/frame.png`
  - `public/card-frames/persistent/frame.png`
  - `public/card-frames/trap/frame.png`
  - `memory-bank/progress.md`
  - `memory-bank/architecture.md`
- 本次改动：
  - 新增 720x1040 透明 PNG 卡牌底框第一版，包含粉蓝渐变底、圆角外框、费用托座、卡图窗、底部三属性托盘和星光装饰。
  - 将同一底框同步到 `common/minion/spell/persistent/trap` 的 `frame.png`，让所有卡牌类型先共用同一套可见底框。
  - 在 `src/style.css` 追加卡框应用规则：卡牌本体背景透明化，`frame.png` 成为可见底框，费用定位到左上托座，卡图与攻防威定位到图片预留窗口。
  - 重写 `public/card-frames/README.md`，明确底框资源命名、推荐尺寸和替换规则。
- 验证：
  - 已检查所有 `frame.png` 尺寸均为 `720 x 1040`。
  - `npm.cmd run build` 通过，并同步生成新版 `dist/`。

### 卡牌框根节点重构
- 影响文件：
  - `src/components/Card.tsx`
  - `src/components/react/CardView.tsx`
  - `src/style.css`
  - `dist/`
  - `memory-bank/progress.md`
  - `memory-bank/architecture.md`
- 本次改动：
  - 所有手牌、换牌、随从、持续物和陷阱卡牌根节点新增 `framed-card` 类。
  - 底框图片不再依赖内部 `card-frame-layers` 子层显示，改为由卡牌根节点直接使用 `frame.png` 作为背景图，降低旧样式层级覆盖风险。
  - CSS 重新定义 `framed-card` 的费用、卡图、攻防威插槽，类型差异仍通过 `public/card-frames/<type>/frame.png` 替换。
- 验证：
  - `npm.cmd run build` 通过，并确认 `dist` 中包含 `framed-card` 与新版 CSS。

### 卡牌数值图标化
- 影响文件：
  - `src/components/Card.tsx`
  - `src/components/react/CardView.tsx`
  - `src/style.css`
  - `dist/`
  - `memory-bank/progress.md`
  - `memory-bank/architecture.md`
- 本次改动：
  - 卡牌正面的攻、防、威胁从文字标签改为图标加数字。
  - 攻击使用剑图案，防御使用盾图案，威胁使用闪电图案；图标当前由 CSS 绘制，后续可以替换为正式图片资产。
  - 数值徽章保留 `aria-label`，悬停详情和规则数据不受影响。
- 验证：
  - `npm.cmd run build` 通过，并同步生成新版 `dist/`。

## 2026-04-29

### 极简数值卡面样式

- 涉及文件：
  - `src/components/Card.tsx`
  - `src/components/react/CardView.tsx`
  - `src/style.css`
  - `dist/`
  - `memory-bank/progress.md`
  - `memory-bank/architecture.md`
- 本次改动：
  - 卡牌正面不再渲染卡名、类型、关键词、简介、效果文本和状态提示。
  - 卡牌正面只保留费用、攻、防、威胁四类数值信息；缺失的数值使用 `-` 占位，避免布局跳动。
  - React 卡牌继续通过悬停 / 聚焦详情展示完整卡名、类型、描述、关键词、效果和状态。
  - 旧字符串模板卡牌补充 `title` / `aria-label`，用于在起手换牌等兼容界面悬停查看基础说明。
  - CSS 新增极简卡面覆盖规则，保证手牌、起手换牌、场上随从、持续物和陷阱都遵守同一数值卡面口径。
- 验证：
  - `npm.cmd run build` 通过，并同步生成新的 Vite `dist/` 产物。
  - `npm.cmd run test` 通过，48/48。
- 外行说明：
  - 现在卡面更像“美术框 + 数值 HUD”，文字说明不再占据卡面空间。
  - 详细效果仍然可以通过鼠标悬停查看，不影响理解和操作。

### 图片式卡牌框架资源层

- 涉及文件：
  - `src/components/Card.tsx`
  - `src/components/react/CardView.tsx`
  - `src/style.css`
  - `public/card-frames/`
  - `dist/`
  - `memory-bank/progress.md`
  - `memory-bank/architecture.md`
- 本次改动：
  - 新增 `public/card-frames/` 资源目录，按 `common / minion / spell / persistent / trap` 拆分卡框图片。
  - 新增 `public/card-frames/README.md`，记录完整卡框、卡图窗、标题牌、文本框、费用宝石、攻血威徽章的命名和尺寸建议。
  - 为旧字符串卡牌模板与 React 卡牌组件都加入 `card-frame-layers` 图片层插槽。
  - 在 `src/style.css` 中按卡牌类型定义卡框图片变量，支持类型专属图片优先、通用图片回退。
  - 补充 1x1 透明 PNG 占位资源，保证资源替换前构建也不会出现缺图片 warning。
- 验证：
  - `npm.cmd run build` 通过，并同步生成新的 Vite `dist/` 产物。
  - `npm.cmd run test` 通过，48/48。
- 外行说明：
  - 现在卡牌可以按“图片框架 + 动态文字”方式继续设计。
  - 以后替换 `public/card-frames/<type>/frame.png` 等图片，就能逐步把卡牌外框变成正式美术。

### 起手换牌费用宝石对齐

- 涉及文件：
  - `src/style.css`
  - `dist/`
  - `memory-bank/progress.md`
- 本次改动：
  - 将起手换牌卡限定在 `.mulligan-grid` 内单独调整，避免影响对局手牌卡。
  - 费用宝石固定到卡面右上角，并提高层级、统一尺寸和边框。
  - 卡名区域增加左右避让和最小高度，避免费用、标题和装饰横条互相叠压。
  - 补充更靠后的 `.mulligan-grid .card > .card-cost` 覆盖，避免通用 `.card > *` 层级规则把费用宝石重新放回普通排版流。
- 验证：
  - `npm.cmd run build` 通过，并同步生成新的 Vite `dist/` 产物。
  - `npm.cmd run test` 通过，48/48。
- 外行说明：
  - 这次只修起手换牌界面里卡牌费用显示偏移的问题，不改卡牌费用、规则或 AI。

## 2026-04-28

### 原创二次元商业卡牌桌面 UI 升级

- 涉及文件：
  - `src/App.tsx`
  - `src/components/react/CardView.tsx`
  - `src/components/react/PlayerHUDView.tsx`
  - `src/components/react/ReactBattleBoard.tsx`
  - `src/style.css`
  - `public/ui/`
  - `dist/`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- 本次改动：
  - 加入原创 Moe Arcana 视觉方向，保留原创表达，不直接复刻炉石素材或商标元素。
  - 新增 `public/ui/moe-arcana-table.svg` 作为战斗桌面背景，并新增四类卡面插画占位：随从、法术、持续、陷阱。
  - `ReactBattleBoard` 增加战斗桌图层、中央回合纹章、Moe Arcana 徽章和战斗品牌锁定结构。
  - `CardView` 增加 `CardArt` 插画窗、卡面扫光元素，以及手牌扇形排列参数 `fanIndex / fanCount`。
  - `PlayerHUDView` 增加萌系头像徽章结构，用于角色面板的二次元风格识别。
  - `style.css` 补充星光背景、玻璃战区、费用宝石、卡框高光、手牌悬停放大、目标脉冲、HUD 高光和响应式约束。
- 验证：
  - `npm.cmd run build` 通过，并同步生成新的 Vite `dist/` 产物。
  - `npm.cmd run test` 通过，48/48。
  - 本地预览服务 `http://localhost:4173/` 返回 HTTP 200。
- 外行说明：
  - 这次不是规则改动，而是把战斗画面从普通面板推进到更接近商业卡牌游戏的原创视觉原型。
  - 真正的最终成品仍需要持续补充角色立绘、音效、粒子和更细的动效，但当前架构已经承载了桌面层、卡框层和卡牌插画层。

### UI 越界与布局稳定修正

- 涉及文件：
  - `src/style.css`
  - `dist/`
  - `memory-bank/progress.md`
  - `memory-bank/architecture.md`
- 本次改动：
  - 移除手牌卡牌扇形旋转和负边距对布局边界的影响，改为稳定宽度、内部横向滚动和轻量悬停反馈。
  - 为战斗画面补充 `.game-shell` 范围内的最大宽度、最小宽度、内部滚动和装饰层裁切规则，避免卡牌、回合纹章、特效层或长文本把画面撑到视口外。
  - 为设置页和换牌页补充全局响应式护栏，让标题、信息格、按钮行、角色卡、天赋卡和多列网格在窄屏下自动收缩或换行。
  - 移动端把首屏信息格改为更保守的单列回退，并限制标题字号，避免 390px 级别截图和手机宽度出现右侧裁切。
- 验证：
  - `npm.cmd run build` 通过，并同步生成新的 Vite `dist/` 产物。
  - `npm.cmd run test` 通过，48/48。
  - 已用本地 Vite 服务在 `1440x900` 与 `390x844` 截图检查，首屏不再向屏幕右侧越界。
- 外行说明：
  - 这次是把“好看但容易歪出去”的装饰和卡牌排布收进真实屏幕边界内。
  - 对局规则、卡牌数据、AI 和引擎流程没有变化。

### 手牌区可见性补修

- 涉及文件：
  - `src/style.css`
  - `dist/`
  - `memory-bank/progress.md`
- 本次改动：
  - 修正上一轮边界治理后手牌区高度不足的问题：桌面端战斗主区第三行改为优先保留手牌高度，不再把手牌当作可裁切区域。
  - 为 `.hand-zone` 和 `.hand-row` 设置明确的最小可见高度，并让手牌卡使用固定可读高度，避免只露出卡面上半截。
  - 针对 940px 以下矮屏增加压缩规则：收紧顶部状态条、棋盘间距和手牌卡内容，而不是隐藏手牌卡底部。
- 验证：
  - `npm.cmd run build` 通过，并同步生成新的 Vite `dist/` 产物。
  - `npm.cmd run test` 通过，48/48。
- 外行说明：
  - 这次专门修的是“对局里手牌看不到”的问题，优先保证底部手牌完整露出。

### 角色 JPG 图片框架

- 涉及文件：
  - `src/types.ts`
  - `src/data/characterArt.ts`
  - `src/data/characters/characterA.ts`
  - `src/data/characters/characterB.ts`
  - `src/data/characters/characterC.ts`
  - `src/data/characters/characterD.ts`
  - `src/data/characters/characterE.ts`
  - `src/data/characters/characterF.ts`
  - `src/data/characters/characterG.ts`
  - `src/App.tsx`
  - `src/components/PlayerHUD.tsx`
  - `src/components/react/PlayerHUDView.tsx`
  - `src/style.css`
  - `public/characters/`
  - `dist/`
- 本次改动：
  - 为 `CharacterDefinition` 增加 `art` 字段，支持 `card / avatar / banner / alt` 四类角色美术配置。
  - 新增 `src/data/characterArt.ts`，统一生成 `/characters/<character_id>/card.jpg`、`avatar.jpg`、`banner.jpg` 的默认路径。
  - 每个现有角色都接入默认图片路径，以后按角色 ID 放 JPG 就能被设置页和对局 HUD 读取。
  - 设置页角色选项新增角色卡图槽；对局 HUD 新增头像图片槽，图片缺失时仍保留占位视觉，不影响操作。
  - 新增 `public/characters/README.md` 和各角色目录占位，说明后续图片放置方式。
- 验证：
  - `npm.cmd run build` 通过，并同步生成新的 Vite `dist/` 产物。
  - `npm.cmd run test` 通过，48/48。
- 外行说明：
  - 以后给角色加图的默认方式是把 JPG 放到 `public/characters/character_x/card.jpg` 和 `avatar.jpg`。
  - 如果想用不同文件名或格式，可以直接改角色数据里的 `art` 字段。

## 2026-04-27

### 大奶跳脸大招释放修正

- 涉及文件：
  - `src/engine/phases.ts`
  - `tests/engine.test.js`
  - `design/角色图鉴.md`
  - `design/game_rule.md`
  - `design/game_design.md`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- 本次改动：
  - 大奶的 `槽位耗散` 改为只扣 1 到 9 点的未就绪槽位。
  - 已经达到 10 / 13 点的跳脸槽或神抽槽，会先保留给回合开始的大招宣告与释放流程。
  - 新增三条测试，覆盖 10 点跳脸能弹出、13 点跳脸能按 Overkill 释放，以及未满 10 点时被动仍会正常扣槽。
- 验证：
  - `npm.cmd test` 通过，48/48。
  - `npm.cmd run build` 通过，并已同步 `dist/` 构建产物。
- 外行说明：
  - 以前大奶刚攒满 10 点或 13 点时，自己的被动会先把点数扣掉，导致大招还没来得及出现就消失。
  - 现在只要槽位已经够发动，大招会先正常进入发动流程；还没攒满的槽位仍然会按大奶的负面被动少 1 点。
- 文档同步：
  - 已同步角色图鉴、规则文档、设计文档和架构记忆中的大奶槽位耗散口径。

### 抽牌判负规则修正

- 涉及文件：
  - `src/engine/effects.ts`
  - `tests/engine.test.js`
  - `design/game_rule.md`
  - `design/game_design.md`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- 本次改动：
  - 抽牌判负规则改为：只要需要抽牌时牌库已经为空，就立即败北。
  - 删除旧的“还要手牌为空才败北”判断。
  - 新增测试覆盖“手里还有牌，但牌库为空且需要抽牌，也会输”的情况。
- 外行说明：
  - 以前像是“牌库没了，但手里还有牌，所以还能撑住”；现在改成“轮到你抽牌时没牌可抽，就直接输”。
  - 这个判断统一放在抽牌函数里，所以摸牌阶段、卡牌效果抽牌、死亡效果抽牌都会走同一条规则。
- 文档同步：
  - 已同步规则文档中的胜利条件和摸牌阶段说明。
  - 已同步设计文档与架构记忆中的抽牌判负口径。

## 2026-04-26

### 对局 UI 亲和度优化

- 涉及文件：
  - `src/components/react/ReactBattleBoard.tsx`
  - `src/components/react/CardView.tsx`
  - `src/components/react/PlayerHUDView.tsx`
  - `src/style.css`
  - `design/game_design.md`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- 本次改动：
  - 顶部状态区新增“当前建议”，会根据对局状态显示“可以出牌”“可以攻击”“等待 AI 行动”“先处理选择”等提示。
  - 回合阶段从英文内部字段改为中文阶段名，例如 `mainTurn` 显示为“主要行动”，减少玩家理解成本。
  - 手牌卡牌新增可用状态标签，能直接显示“可以打出”“费用不足”“战场已满”“第几回合后可用”等原因。
  - 槽位面板恢复说明文字，会显示“还差几点到 10 点”“10 点已就绪”“13 点已满”，让玩家不用自己心算。
  - 卡牌详情补全新版关键词和新版效果的中文说明，避免新卡在悬停说明里出现内部英文名。
  - 空战场、空手牌、无持续物和无盖伏的提示改成更温和的状态说明。
  - 战斗日志标题从英文改为中文，生命和法力标签也改为中文。
  - 样式上增加当前建议卡、可打出状态、槽位就绪状态和新版关键词徽章颜色。
- 验证：
  - `npm.cmd run build` 通过。
  - `npm.cmd test` 通过：44/44。
- 外行说明：
  - 顶部提示就像“现在轮到你该做什么”的小提醒，玩家不用猜下一步。
  - 手牌上的状态标签就像商店里的“可购买 / 钱不够”标识，不能用的原因会直接写出来。
  - 槽位提示把进度条翻译成一句话，玩家能一眼知道离大招还差多少。
  - 空区域提示不再只是冷冰冰地写“没有”，而是告诉玩家这个区域现在代表什么。
- 文档同步：
  - 已同步 `design/game_design.md` 的 UI / UX 目标。
  - 已同步 `memory-bank/architecture.md` 的 React 战斗面板职责说明。

## 2026-04-25

### 战场盖伏数量标记

- 涉及文件：
  - `src/components/react/ReactBattleBoard.tsx`
  - `src/components/Board.tsx`
  - `src/style.css`
  - `memory-bank/progress.md`
- 本次改动：
  - 在双方战场标题区加入固定计数徽章，显示 `持续 X` 与 `盖伏 X`。
  - 盖伏数量大于 0 时使用更醒目的徽章状态，方便玩家快速识别场上盖伏数量。
  - 同步更新 React 战斗面板与旧字符串渲染备用面板，保持两条渲染路径展示一致。
- 验证：
  - `npm.cmd test`
  - `npm.cmd run build`
- 关联修正检查：
  - 仅调整 UI 展示与样式，不修改规则、卡牌数据或测试断言。

### 泉亚猫与大后期破坏流实装

- 涉及文件：
  - `src/types.ts`
  - `src/data/characters.ts`
  - `src/data/characters/characterG.ts`
  - `src/data/decks.ts`
  - `src/data/talents/resource.ts`
  - `src/data/talents/deckControl.ts`
  - `src/data/talents/survival.ts`
  - `src/engine/gameState.ts`
  - `src/engine/effects.ts`
  - `src/engine/phases.ts`
  - `src/engine/ai.ts`
  - `tests/engine.test.js`
  - `README.md`
  - `design/game_rule.md`
  - `design/game_design.md`
  - `design/角色图鉴.md`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- 本次改动：
  - 根据 `design/update.md` 新增第 7 名角色泉亚猫，接入角色聚合、默认卡组与 AI 画像。
  - 新增 5 个天赋：魔力突破、深渊魔力、精神污染、虚空倒灌、恩泽涌动。
  - 增加最大费用上限、爆牌触发对方弃牌、爆牌触发磨牌、恢复量加成、手牌不足转伤害等规则能力。
  - 泉亚猫 10 点大招使用随机弃牌，13 点大招使用最高费用优先弃牌来模拟精准挑选。
  - 同步 README、规则文档、设计文档、角色图鉴和架构记忆中的角色数量、备牌库与新增系统说明。
- 验证：
  - `npm.cmd test`
  - `npm.cmd run build`
- 关联修正检查：
  - 已补充费用上限、爆牌联动、恢复加成、泉亚猫空手惩罚和最高费用弃牌测试。
  - `dist/` 已通过 Vite 构建同步。

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
  - 根据 `design/update_design.md` 接入首批 4 张公共 13 点神抽终结者和 6 张大魔法；后续 v1.2.1 已扩充为 5 张公共终结者。
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

### 为非 Git 安装加入压缩包自动更新备用路径

- 涉及文件：
  - `start-game.ps1`
  - `update-source.json`
  - `.gitignore`
  - `README.md`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- 本次改动：
  - 保留 Git 快进更新作为开发目录的优先更新方式。
  - 新增无 Git 备用路径：下载最新 GitHub 分支压缩包，把受管理文件写入当前目录，并记录本地更新状态、提交号和文件哈希。
  - 为压缩包更新路径加入本地修改保护，避免自动更新静默覆盖用户改过的文件。
- 验证：
  - PowerShell 脚本语法解析通过。
- 关联修正检查：
  - 已更新面向用户的 README 和架构说明，把新更新流程与现有启动流程放在同一处说明。

### 移除无结算数据时的默认提示框

- 涉及文件：
  - `src/components/MomentumPanel.tsx`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- 本次改动：
  - 移除势能面板在还没有真实结算结果时显示的默认提示框。
  - 结算区域现在只在存在 `lastAdvantage` 时渲染。
- 验证：
  - `cmd /c npm run build`
- 关联修正检查：
  - 保留真实的“上次结算”区块，只删除无数据占位提示。

### 将重新开始按钮移动到手牌工具栏

- 涉及文件：
  - `src/components/Board.tsx`
  - `src/style.css`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- 本次改动：
  - 将 `重新开始` 按钮从标题栏日志卡移到手牌区工具栏，并放在 `取消攻击选择` 左侧。
  - 再次简化标题栏日志卡，使其只渲染可滚动日志内容。
- 验证：
  - `cmd /c npm run build`
- 关联修正检查：
  - 在标记结构中固定手牌工具栏顺序，确保桌面布局下重新开始按钮始终位于取消攻击按钮左侧。

### 压缩标题栏日志卡

- 涉及文件：
  - `src/components/Board.tsx`
  - `src/style.css`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- 本次改动：
  - 移除标题栏日志标题，只在日志条目上方保留紧凑的重新开始控件。
  - 缩小标题栏日志卡内边距、可见日志高度、按钮尺寸和日志条目密度，使其更平稳地放入标题栏。
- 验证：
  - `cmd /c npm run build`
- 关联修正检查：
  - 保留完整日志内容和滚动行为，只压缩标题栏中的展示形式。

### 将战斗日志移动到标题栏右侧

- 涉及文件：
  - `src/components/Board.tsx`
  - `src/style.css`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- 本次改动：
  - 将战斗日志从右侧栏移到对局标题栏右侧。
  - 新增 `hero-log-card` 布局，让标题栏形成左侧状态、中间对局信息、右侧日志的结构。
- 验证：
  - `cmd /c npm run build`
- 关联修正检查：
  - 保留窄屏回退规则，让标题栏日志在宽度不足时换到其他内容下方，而不是挤坏布局。

### 移除战斗 UI 面板中过多的解释文字

- 涉及文件：
  - `src/components/Board.tsx`
  - `src/components/MomentumPanel.tsx`
  - `src/components/PlayerHUD.tsx`
  - `src/components/SlotMeter.tsx`
  - `src/style.css`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- 本次改动：
  - 移除势能面板标题中的描述副标题。
  - 移除跳脸槽和神抽槽徽章中的额外解释文字。
  - 移除独立的槽位提示侧栏卡，让右侧栏集中展示势能与战斗日志。
- 验证：
  - `cmd /c npm run build`
- 关联修正检查：
  - 移除槽位提示卡后同步调整桌面侧栏行高，让剩余面板仍能干净地填满区域。

### 将对局信息移动到标题栏中部

- 涉及文件：
  - `src/components/Board.tsx`
  - `src/style.css`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- 本次改动：
  - 将对局标题栏拆成左侧标题/状态和中间对局信息条，让回合、行动方、阶段和攻击状态不再挤在最右侧。
  - 添加桌面端三列标题栏网格，并保留小屏回退布局。
- 验证：
  - `cmd /c npm run build`
- 关联修正检查：
  - 修改范围限定在对局标题栏，战场、侧栏和移动端回退结构保持不变。

### 压缩玩家状态资源与槽位徽章

- 涉及文件：
  - `src/components/SlotMeter.tsx`
  - `src/style.css`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- 本次改动：
  - 缩小桌面端玩家状态中的生命和法力标签，并压缩资源徽章间距，避免文字溢出。
  - 增加专用槽位徽章类名，压缩槽位卡标题、计数和注记文字，让跳脸槽与神抽槽更稳定地放入玩家信息面板。
- 验证：
  - `cmd /c npm run build`
- 关联修正检查：
  - 调整范围限定在对局玩家状态布局和槽位组件，没有修改规则或其他卡牌面板结构。

### 围绕信息可读性重排桌面 UI

- 涉及文件：
  - `src/style.css`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- 本次改动：
  - 战斗行改为保持卡牌可读宽度，并用内部横向滚动承载更多卡牌，避免把卡牌压到说明文字拥挤。
  - 将势能面板改为纵向堆叠，并把角色被动说明做成独立可读区块，让侧栏和玩家状态信息更自然。
- 验证：
  - `cmd /c npm run build`
- 关联修正检查：
  - 保留小屏回退规则，使本次可读性调整只影响桌面对局布局。

### 扩展对局 UI 的屏幕宽度利用

- 涉及文件：
  - `src/style.css`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- 本次改动：
  - 移除 `.game-shell` 的固定最大宽度，让对局画面能更接近占满显示器宽度。
  - 将侧栏、玩家状态列和桌面卡牌宽度改为 `clamp(...)`，让大屏更自然地利用额外空间。
- 验证：
  - `cmd /c npm run build`
- 关联修正检查：
  - 保留现有 `@media (max-width: 1180px)` 小屏回退，避免宽屏行为影响窄屏布局。

### 重做桌面端战斗 UI

- 涉及文件：
  - `src/components/Board.tsx`
  - `src/style.css`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- 本次改动：
  - 将游戏棋盘重组为上下两个横向战场区，并加入专用紧凑手牌区，使主对局画面更有效使用显示器宽度。
  - 增加 `.game-shell` 桌面专用布局规则，让战斗画面保持在视口内，并把溢出交给战斗日志等内部面板处理。
- 验证：
  - `cmd /c npm run build`
- 关联修正检查：
  - 新布局规则只作用于对局画面，设置页和换牌页保持原有响应式行为。

### 增加设计文档与规则文档同步要求

- 涉及文件：
  - `SKILL.md`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- 本次改动：
  - 增加内容更新时必须检查并更新 `design/game_design.md` 的规则。
  - 增加规则更新时必须检查并更新 `design/game_rule.md` 的规则。
- 验证：
  - 仅文档更新，未运行构建或测试。
- 关联修正检查：
  - 确认仓库当前使用 `design/game_design.md` 和 `design/game_rule.md` 作为有效设计与规则文档。

### 增加内容任务必须使用 SKILL 的代理规则

- 涉及文件：
  - `AGENT.md`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- 本次改动：
  - 增加明确代理规则：在内容更新、设计同步、规则文档和图鉴维护任务前必须先阅读 `SKILL.md`。
  - 增加对应规则：使魔改动必须同步维护使魔图鉴。
- 验证：
  - 仅文档更新，未运行构建或测试。
- 关联修正检查：
  - 确认 `SKILL.md` 仍是仓库内容更新流程文档，且使魔图鉴目标已迁移到 `design/minion.md`。

### 更新 SKILL 中的使魔图鉴同步规则

- 涉及文件：
  - `SKILL.md`
  - `memory-bank/progress.md`
- 本次改动：
  - 增加规则：只要修改使魔或新增使魔，就必须同步更新使魔图鉴。
  - 明确默认目标是 `design/minion.md`；如果仓库仍维护 `design/minion_codex.md`，才回退到该文件。
- 验证：
  - 仅文档更新，未运行构建或测试。
- 关联修正检查：
  - 当前仓库已使用 `design/minion.md` 作为使魔图鉴。

### 使魔数据文件模块化

- 涉及文件：
  - `src/data/cards/minions.ts`
  - `src/data/cards/minions/lowCost.ts`
  - `src/data/cards/minions/midCost.ts`
  - `src/data/cards/minions/highCost.ts`
  - `src/data/cards/minions/guardPackage.ts`
  - `memory-bank/architecture.md`
- 本次改动：
  - 将使魔定义从单一 `minions.ts` 拆分到分组子模块。
  - 保留 `src/data/cards/minions.ts` 作为稳定聚合出口，避免上层 import 路径联动修改。
- 验证：
  - `cmd /c npm test`
- 关联修正检查：
  - 已验证 `src/data/cards.ts` 能继续从同一路径导入 `MINION_CARDS`，引擎、UI 和测试无需改 import。

### 增加护卫使魔包与图鉴

- 涉及文件：
  - `src/data/cards/minions.ts`
  - `src/engine/effects.ts`
  - `src/engine/rules.ts`
  - `tests/engine.test.js`
  - `design/minion_codex.md`
  - `memory-bank/architecture.md`
- 本次改动：
  - 新增 7 张围绕护卫机制设计的使魔。
  - 增加 `onAttacked`、生成衍生物到手牌、相邻护卫扩散、低血自我强化、威慑压制威胁值和魔抗指定限制等运行时支持。
  - 在 `design/` 下新增使魔图鉴文档。
- 验证：
  - `cmd /c npm run build`
  - `cmd /c npm test`
- 关联修正检查：
  - 已为新机制增加引擎测试，并同步势能计算中的 `menace` 规则。

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


### React 战斗面板、Pixi 特效与卡牌检视提示

- 修改文件：
  - `src/components/react/CardView.tsx`
  - `src/components/react/PlayerHUDView.tsx`
  - `src/components/react/ReactBattleBoard.tsx`
  - `src/game-view/pixi/PixiBattlefieldHost.tsx`
  - `src/App.tsx`
  - `src/style.css`
  - `memory-bank/2026-04-25-react-board-pixi.md`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
- 修改内容：
  - 将战斗画面旧的 `renderBoard()` 字符串模板路径替换为真实 React 组件，同时保留设置与换牌阶段的旧兼容路径。
  - 增加 React 卡牌、使魔、持续魔法/盖伏、玩家状态、战斗面板、待处理选择、游戏结束、战斗日志和势能面板组合。
  - 保留 PixiJS 作为只负责显示的前景特效层，用于攻击轨迹、伤害数字、命中特效、召唤粒子和法术/盖伏/持续魔法爆发。
  - 移除临时 Pixi 战场底图；Pixi 现在只创建固定的 `pixi-battlefield-effects` 画布，并设置 `pointer-events: none`。
  - 通过 `data-pixi-entity-id` 增加 DOM 坐标映射，使 Pixi 特效能对齐真实 React 卡牌和玩家状态区域。
  - 收紧战斗布局行高、侧栏、卡牌高度、文本截断和内部溢出，使战斗中画面保持可读。
  - 增加统一的悬停/聚焦卡牌详情提示，覆盖手牌、场上使魔、持续魔法与盖伏，也支持当前不可打出的手牌。
- 验证：
  - `npm.cmd run build`
  - `npm.cmd test` 通过：27/27。
  - 本地 Vite 服务器返回 HTTP 200。
- 相关同步：
  - 已将 `memory-bank/2026-04-25-react-board-pixi.md` 的当日实现记录汇总进长期架构和进度记录。

### v1.2.1 核心魔法、特殊使魔与槽位上限更新

- 修改文件：
  - `src/types.ts`
  - `src/engine/rules.ts`
  - `src/engine/effects.ts`
  - `src/engine/phases.ts`
  - `src/engine/slotResolver.ts`
  - `src/engine/gameState.ts`
  - `src/engine/ai.ts`
  - `src/data/cards/spells.ts`
  - `src/data/cards/traps.ts`
  - `src/data/cards/persistents.ts`
  - `src/data/cards/minions/lowCost.ts`
  - `src/data/cards/minions/midCost.ts`
  - `src/data/cards/minions/sideboardFinishers.ts`
  - `src/data/decks.ts`
  - `src/data/talents/resource.ts`
  - `src/data/talents/spell.ts`
  - `src/data/talents/slotControl.ts`
  - `tests/engine.test.js`
  - `design/game_rule.md`
  - `design/game_design.md`
  - `design/minion.md`
  - `memory-bank/progress.md`

- 本次修改：
  - 新增 `绝影刺客·瞬`，并加入公开大地牌库；攻击时可无视护卫。
  - 修正 `虚数之影·卡奥斯`为最多磨 15 张，并在敌方牌库剩 7 张时停止。
  - 新增 `时空篡夺`、`爆裂炎枪`、`流星火雨`、`大魔力宝石`、`魔力干涸`。
  - 新增第 5 回合后可用的出牌限制、费用为 5 时触发的盖伏检测、额外回合 12 费覆盖逻辑。
  - 增加跳脸槽与神抽槽的自然增长上限，并加入 `跳脸上限突破`、`神抽上限突破`与 `逆境神龛`的上限加成。
  - 调整 `巨步推进`、`法术专注`、`招财猫`、`典籍猫头鹰`、`逆境神龛`。
  - 补充 44 个引擎测试，覆盖新增卡牌、陷阱触发、额外回合、槽位上限和卡牌重做。

- 验证：
  - `npm.cmd run typecheck` 通过。
  - `npm.cmd test` 通过：44/44。

## 2026-04-29

### Card JPG illustrations and resource framework

- Touched files:
  - `src/types.ts`
  - `src/data/cardArt.ts`
  - `src/data/cards.ts`
  - `src/engine/rules.ts`
  - `src/components/react/CardView.tsx`
  - `src/components/Card.tsx`
  - `src/style.css`
  - `public/cards/README.md`
  - `scripts/generate-card-art.ps1`
  - `public/cards/*.jpg`
  - `dist/cards/*.jpg`
- Changes:
  - Added card-level `art` support and automatic `/cards/<card-id>.jpg` mapping.
  - Propagated card art into runtime hand cards, summoned minions, and persistent/trap instances.
  - Updated React and legacy card renderers so the framed card art window uses JPG illustrations when available.
  - Generated 56 simple anime-style JPG card illustrations from card id/type/effect signals.
  - Documented the asset convention for replacing or regenerating card art.
- Verification:
  - `npm.cmd run build` passed.
  - `npm.cmd run test` passed, 49/49 tests.
- Notes:
  - Did not start a Vite dev server; user requested manual server startup.

### Non-minion card frame redesign

- Touched files:
  - `src/components/react/CardView.tsx`
  - `src/components/Card.tsx`
  - `src/style.css`
  - `scripts/generate-card-frames.ps1`
  - `public/card-frames/spell/frame.png`
  - `public/card-frames/persistent/frame.png`
  - `public/card-frames/trap/frame.png`
  - `dist/card-frames/spell/frame.png`
  - `dist/card-frames/persistent/frame.png`
  - `dist/card-frames/trap/frame.png`
- Changes:
  - Rebuilt spell, persistent, and trap frames as visually distinct no-stat-slot card frames.
  - Removed attack / defense / threat rendering from spell, trap, and persistent cards.
  - Expanded non-minion card art windows to use the freed space.
- Verification:
  - `npm.cmd run build` passed.
  - `npm.cmd run test` passed, 49/49 tests.
- Notes:
  - Did not start a Vite dev server.

### Non-minion frame cache fix

- Touched files:
  - `src/style.css`
- Changes:
  - Added final CSS overrides with versioned frame URLs for spell, persistent, and trap frames.
  - This forces browsers/dev servers to fetch the redesigned non-stat frames instead of reusing old cached `frame.png` files.
- Verification:
  - `npm.cmd run build` passed.
  - `npm.cmd run test` passed, 49/49 tests.
  - Confirmed built CSS contains `?v=nonstat-20260429-2`.

### In-battle mulligan prompt and opaque hand cards

- Touched files:
  - `src/store/useGameStore.ts`
  - `src/App.tsx`
  - `src/components/react/ReactBattleBoard.tsx`
  - `src/style.css`
  - `dist/assets/index-CZSEy7OI.css`
  - `dist/assets/index-BqXz0-K2.js`
- Changes:
  - Removed the separate opening mulligan screen from the active flow.
  - The game now enters the main battle UI immediately during mulligan and asks whether to replace the opening hand.
  - If the player chooses to replace, an in-board modal lets them select cards and confirm the redraw.
  - Hand cards in the battle hand row are now opaque instead of semi-transparent while disabled.
- Verification:
  - `npm.cmd run build` passed.
  - `npm.cmd run test` passed, 49/49 tests.
- Notes:
  - Did not start a Vite dev server.

### Mulligan prompt positioning and selection fix

- Touched files:
  - `src/components/react/CardView.tsx`
  - `src/components/react/ReactBattleBoard.tsx`
  - `src/style.css`
  - `dist/assets/index-BjdMsNvy.css`
  - `dist/assets/index-C94A4Bs7.js`
- Changes:
  - Centered the opening mulligan prompt on the playmat instead of biasing it toward the lower/edge UI.
  - Added `HandCard.onSelect` for mulligan selection so opening cards can be toggled independently of normal playability.
  - Added a small selected-state marker on mulligan cards for clearer feedback.
- Verification:
  - `npm.cmd run build` passed.
  - `npm.cmd run test` passed, 49/49 tests.
- Notes:
  - Did not start a Vite dev server.

### Removed legacy mulligan screen framework

- Touched files:
  - `src/App.tsx`
  - `src/components/Card.tsx`
  - `src/style.css`
  - `dist/assets/index-CDnVGKzo.css`
  - `dist/assets/index-B4hGXCPz.js`
- Changes:
  - Deleted the old standalone `renderMulliganScreen()` path from `App.tsx`.
  - Deleted the old `onMulliganAction()` click protocol and removed the `screen === "mulligan"` legacy action branch.
  - Deleted the old HTML `renderMulliganCard()` helper and its `data-action="toggle-mulligan"` entry point.
  - Removed the old `.mulligan-grid` CSS rules so only the in-battle React mulligan overlay remains.
  - Verified `src` and `dist` contain no `mulligan-grid`, `renderMulliganCard`, `renderMulliganScreen`, `onMulliganAction`, or `toggle-mulligan` matches.
- Verification:
  - `npm.cmd run build` passed.
  - `npm.cmd run test` passed, 49/49 tests.
- Notes:
  - Did not start a Vite dev server.

### Direct hand-row mulligan flow

- Touched files:
  - `src/store/useGameStore.ts`
  - `src/components/react/ReactBattleBoard.tsx`
  - `src/style.css`
  - `dist/assets/index-Zu22pRTb.css`
  - `dist/assets/index-Dw6jRUZb.js`
- Changes:
  - Removed the modal-style `MulliganOverlay` flow.
  - During `screen: "mulligan"`, the bottom hand row becomes the selection surface.
  - Players click cards in hand to mark them for replacement, then click the always-available `更换手牌` button.
  - Selecting zero cards and clicking `更换手牌` keeps the current hand and enters the first turn.
  - Removed `uiState.mulliganMode`; the store now only tracks `mulliganSelection`.
  - Verified `src` and `dist` contain no `mulligan-overlay`, `mulligan-modal`, `mulligan-card-row`, `mulliganMode`, `beginMulliganSelection`, or `clearMulliganSelection` matches.
- Verification:
  - `npm.cmd run build` passed.
  - `npm.cmd run test` passed, 49/49 tests.
- Notes:
  - Did not start a Vite dev server.

### Global code audit and legacy renderer cleanup

- Touched files:
  - `.gitignore`
  - `src/App.tsx`
  - `src/components/Board.tsx` (deleted)
  - `src/components/Card.tsx` (deleted)
  - `src/components/EffectLayer.tsx` (deleted)
  - `src/components/PlayerHUD.tsx` (deleted)
  - `src/components/ResolutionPanel.tsx` (deleted)
  - `src/components/SlotMeter.tsx` (deleted)
  - `src/components/MomentumPanel.tsx` (already removed)
  - `dist/assets/index-Zu22pRTb.css`
  - `dist/assets/index-CCqyjkNw.js`
  - `dist/assets/PixiBattlefieldHost-D9S2aSa3.js`
  - `memory-bank/architecture.md`
  - `memory-bank/progress.md`
  - `design/game_design.md`
- Changes:
  - Removed the confirmed-unused string-rendered battle UI stack from `src/components`.
  - Removed the now-unreachable battle `data-action` click handler from `App.tsx`; setup actions remain supported.
  - Removed temporary `.vite-*` log files from the workspace.
  - Broadened `.gitignore` so future `.vite-server*.log` and `.vite-node*.log` files stay out of version control.
  - Regenerated `dist/` through the normal build pipeline after source cleanup.
- Verification:
  - `npm.cmd run typecheck -- --noUnusedLocals --noUnusedParameters` passed.
  - Local import graph check from `src/main.tsx` found `0` unreachable source files.
  - `npm.cmd run build` passed.
  - `npm.cmd run test` passed, 49/49 tests.
- Notes:
  - Did not start a Vite dev server.
  - Remaining cleanup target: `src/style.css` is large and should be modularized in a later UI refactor.
  - Remaining cleanup target: `ReactBattleBoard.tsx` is large but still active/cohesive; split it later by hand, lanes, side backrow, and log/control dock.
  - Remaining cleanup target: setup still uses the legacy string-template path and can later move to React.

# Shindoro

`Shindoro` 是一个基于 TypeScript 的卡牌对战原型项目。
当前版本以 [design/game_rule.md](./design/game_rule.md) 的 v1.2 规则为基准，使用原生 DOM 渲染而不是 React 运行时。

## 当前状态

- 玩家 vs AI 对战
- 6 名角色，编号 A-F
- `50` 张主卡组 + `3` 张备牌库
- 先后手动态定价天赋
- `turnStart -> slotResolution -> draw -> mainTurn -> combat -> turnEnd` 阶段流
- 跳脸槽 / 神抽槽系统
- 攻击撞击特效

## 快速启动

### Windows 一键启动

直接运行根目录的 [start-game.bat](./start-game.bat)。

它会：

- 检查 `npm`
- 如缺少依赖则先执行 `npm install`
- 启动 `npm start`
- 使用独立浏览器窗口打开游戏
- 关闭该游戏窗口后自动关闭服务器

说明：

- 这个自动关服方案优先支持 Edge / Chrome / Brave
- 默认地址为 `http://localhost:4173`

### 通用手动启动

```powershell
npm start
```

启动后访问：

```text
http://localhost:4173
```

## 常用命令

```powershell
npm start
```

- 先构建，再启动本地静态服务器

```powershell
npm run build
```

- 重新生成 `dist/`

```powershell
npm test
```

- 先构建，再运行 [tests/engine.test.js](./tests/engine.test.js)

## 目录结构

```text
.
├─ src/                  # TypeScript 源码
│  ├─ components/        # UI 组件
│  ├─ data/              # 角色、卡牌、天赋、卡组数据
│  ├─ engine/            # 游戏规则与结算逻辑
│  ├─ store/             # UI 与游戏引擎的桥接层
│  ├─ App.tsx            # 顶层界面入口
│  ├─ main.ts            # 挂载入口
│  └─ style.css          # 全局样式
├─ dist/                 # 编译产物
├─ design/               # 规则与设计文档
├─ memory-bank/          # 项目记忆与协作文档
├─ tests/                # 测试
├─ index.html
├─ package.json
├─ server.js             # 本地静态服务器
├─ start-game.bat        # Windows 一键启动
└─ start-game.ps1        # 生命周期启动器
```

## 数据结构说明

### 角色

- 根入口：[src/data/characters.ts](./src/data/characters.ts)
- 具体模块：`src/data/characters/characterA.ts` 到 `characterF.ts`

### 卡牌

- 根入口：[src/data/cards.ts](./src/data/cards.ts)
- 类型拆分：
  - `src/data/cards/minions.ts`
  - `src/data/cards/spells.ts`
  - `src/data/cards/persistents.ts`
  - `src/data/cards/traps.ts`

### 天赋

- 根入口：[src/data/talents.ts](./src/data/talents.ts)
- 分类拆分：
  - `src/data/talents/survival.ts`
  - `src/data/talents/resource.ts`
  - `src/data/talents/deckControl.ts`
  - `src/data/talents/combat.ts`
  - `src/data/talents/spell.ts`
  - `src/data/talents/burst.ts`
  - `src/data/talents/slotControl.ts`

## 运行说明

- 日常开发主要修改 `src/`
- `dist/` 是构建后的可运行产物
- 测试直接依赖 `dist/`，所以只改 `src/` 但不构建时，测试不会看到最新代码

## 相关文档

- [design/game_rule.md](./design/game_rule.md)：当前规则主文档
- [design/game_design.md](./design/game_design.md)：设计文档
- [AGENT.md](./AGENT.md)：代理协作规则
- [memory-bank/architecture.md](./memory-bank/architecture.md)：项目结构入口
- [memory-bank/progress.md](./memory-bank/progress.md)：修改履历

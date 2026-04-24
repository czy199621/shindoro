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

### 自动更新并启动

直接运行根目录的 [update-and-start.bat](./update-and-start.bat)。

它会：

- 优先尝试使用本地 Git 工作区执行快速更新
- 如果本机没有可用的 Git 更新条件，则自动退回到 GitHub 压缩包更新
- 更新完成后继续调用 `start-game.ps1` 启动游戏

说明：

- 普通使用者现在不需要额外配置 Git，也可以自动更新
- 如果检测到 Git 工作区未提交改动，会跳过更新，避免覆盖开发中的本地文件
- 如果是无 Git 的压缩包安装方式，启动器会记录一份本地更新状态；若检测到上次更新后的本地文件改动，也会跳过更新以保护当前目录
- 默认更新源配置写在 [update-source.json](./update-source.json)

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

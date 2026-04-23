# Shindoro

`神どろ (Shin Doro)` 的浏览器原型项目。

当前仓库的重点是先验证规则与平衡，而不是前端框架本身。现版本使用：

- TypeScript
- 原生 ES Modules
- 自定义静态服务器

不是 `React + Vite` 项目。

---

## 当前已实现内容

- 玩家 vs AI 对战
- 角色选择
- 赛前天赋购买
- 起手抽牌与 Mulligan
- 法力成长与出牌
- 使魔攻击、法术、持续魔法、陷阱
- 势能 `V` 结算
- 跳脸槽 / 神抽槽
- 10 点可选发动与 13 点强制发动
- 公共备牌库神抽
- 基础 AI 行为
- 浏览器单页试玩界面

---

## 运行方式

在项目根目录执行：

```powershell
npm start
```

启动后打开：

```text
http://localhost:4173
```

---

## 常用命令

```powershell
npm start
```

构建并启动本地服务器。

```powershell
npm run build
```

把源码编译到 `dist/`。

```powershell
npm test
```

重新构建并运行当前测试。

---

## 项目结构

```text
.
├── dist/                 # 编译产物
├── public/               # 静态资源
├── src/                  # TypeScript 源码
│   ├── components/       # UI 组件
│   ├── data/             # 卡牌、角色、天赋、牌组数据
│   ├── engine/           # 规则引擎
│   └── store/            # 前端状态组织
├── tests/                # 测试
├── design/               # 规则与设计文档目录
├── index.html            # 浏览器入口
├── package.json
├── server.js             # 本地静态服务器
└── tsconfig.json
```

---

## 文档入口

- [design/game_rule.md](./design/game_rule.md)：当前规则主文档
- [design/game_design.md](./design/game_design.md)：设计思路与结构建议

如果规则与实现有冲突，现阶段请优先以 `design/game_rule.md` 和实际运行结果为准。

---

## 开发说明

- `src/` 只保留源码
- `dist/` 是编译输出目录
- 当前测试文件是 [tests/engine.test.js](./tests/engine.test.js)
- 页面样式集中在 [src/style.css](./src/style.css)
- 游戏主入口在 [src/main.ts](./src/main.ts)

---

## 当前目标

当前阶段优先事项：

- 继续验证规则是否顺手
- 观察角色强弱与卡组平衡
- 检查双槽系统是否有足够的逆转感
- 逐步补足测试与数据统计工具

等玩法稳定后，再考虑是否迁移到更重的前端框架。

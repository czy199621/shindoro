import type { CardDefinition } from "../../types.js";

export const PERSISTENT_CARDS: CardDefinition[] = [
  {
    id: "underdog_shrine",
    name: "逆境神龛",
    cost: 3,
    type: "persistent",
    threat: 1,
    description: "你的回合开始时：神抽槽 +1。",
    effects: [{ trigger: "onTurnStart", action: { type: "addSlot", slot: "godDraw", amount: 1 } }]
  },
  {
    id: "war_banner",
    name: "战祀旗",
    cost: 3,
    type: "persistent",
    threat: 2,
    description: "你的回合开始时：己方使魔获得 +1 攻击力。",
    effects: [{ trigger: "onTurnStart", action: { type: "buff", target: "allFriendlyMinions", atk: 1 } }]
  },
  {
    id: "sage_archive",
    name: "贤者档案",
    cost: 4,
    type: "persistent",
    threat: 2,
    description: "你的回合开始时：抽 1 张牌。",
    effects: [{ trigger: "onTurnStart", action: { type: "draw", count: 1 } }]
  }
];

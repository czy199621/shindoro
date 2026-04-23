import type { CardDefinition } from "../../../types.js";

export const LOW_COST_MINIONS: CardDefinition[] = [
{
    id: "novice_mage",
    name: "见习术士",
    cost: 2,
    type: "minion",
    attack: 2,
    health: 3,
    threat: 3,
    description: "战吼：抽 1 张牌。",
    effects: [{ trigger: "onPlay", action: { type: "draw", count: 1 } }]
  },
{
    id: "ember_wolf",
    name: "余烬狼",
    cost: 1,
    type: "minion",
    attack: 2,
    health: 1,
    threat: 2,
    description: "冲锋。",
    tags: ["rush"],
    effects: []
  },
{
    id: "shrine_guard",
    name: "神龛卫兵",
    cost: 1,
    type: "minion",
    attack: 1,
    health: 3,
    threat: 2,
    description: "战吼：神抽槽 +1。",
    effects: [{ trigger: "onPlay", action: { type: "addSlot", slot: "godDraw", amount: 1 } }]
  },
{
    id: "shield_doll",
    name: "盾偶",
    cost: 2,
    type: "minion",
    attack: 1,
    health: 4,
    threat: 3,
    description: "战吼：己方角色恢复 1 点生命。",
    effects: [{ trigger: "onPlay", action: { type: "heal", target: "selfHero", amount: 1 } }]
  },
{
    id: "dawn_healer",
    name: "拂晓医者",
    cost: 2,
    type: "minion",
    attack: 2,
    health: 2,
    threat: 3,
    description: "战吼：己方角色恢复 3 点生命。",
    effects: [{ trigger: "onPlay", action: { type: "heal", target: "selfHero", amount: 3 } }]
  }
];

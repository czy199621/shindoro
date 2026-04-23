import type { CardDefinition } from "../../../types.js";

export const HIGH_COST_MINIONS: CardDefinition[] = [
{
    id: "grave_knight",
    name: "墓誓骑士",
    cost: 5,
    type: "minion",
    attack: 5,
    health: 5,
    threat: 7,
    description: "战吼：己方角色恢复 2 点生命。",
    effects: [{ trigger: "onPlay", action: { type: "heal", target: "selfHero", amount: 2 } }]
  },
{
    id: "iron_colossus",
    name: "铁律巨像",
    cost: 6,
    type: "minion",
    attack: 7,
    health: 7,
    threat: 10,
    description: "朴素而沉重的终结者。",
    effects: []
  },
{
    id: "miracle_guardian",
    name: "奇迹守护者",
    cost: 5,
    type: "minion",
    attack: 5,
    health: 6,
    threat: 8,
    description: "战吼：抽 1 张牌。",
    effects: [{ trigger: "onPlay", action: { type: "draw", count: 1 } }]
  }
];

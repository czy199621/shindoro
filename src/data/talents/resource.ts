import type { TalentDefinition } from "../../types.js";

export const RESOURCE_TALENTS: TalentDefinition[] = [
  {
    id: "opening_insight",
    name: "开局洞见",
    category: "resource",
    pricing: { first: 4, second: 2 },
    availableFor: "both",
    repeatLimit: 1,
    description: "起手额外抽 1 张牌。",
    effect: { type: "bonusDraw", amount: 1 }
  },
  {
    id: "tactical_coin",
    name: "战术硬币",
    category: "resource",
    pricing: { first: 4, second: 1 },
    availableFor: "both",
    repeatLimit: 1,
    description: "游戏开始时，将 1 张 0 费魔法卡“硬币”置入你的手牌。",
    effect: { type: "addOpeningCard", cardId: "coin" }
  },
  {
    id: "wide_grip",
    name: "广识之手",
    category: "resource",
    pricing: { first: 2, second: 2 },
    availableFor: "both",
    repeatLimit: 1,
    description: "手牌上限 +2。",
    effect: { type: "addHandLimit", amount: 2 }
  },
  {
    id: "giant_stride",
    name: "巨步推进",
    category: "resource",
    pricing: { first: 3, second: 2 },
    availableFor: "both",
    repeatLimit: 1,
    description: "费用高于 6 的使魔法力消耗 -1。",
    effect: { type: "reduceHighCostMinionCost", threshold: 6, amount: 1 }
  },
  {
    id: "mana_breakthrough",
    name: "魔力突破",
    category: "resource",
    pricing: { first: 2, second: 2 },
    availableFor: "both",
    repeatLimit: 1,
    description: "游戏最大费用上限提升至 11 点。",
    effect: { type: "setManaCap", amount: 11 }
  },
  {
    id: "abyssal_mana",
    name: "深渊魔力",
    category: "resource",
    pricing: { first: 3, second: 3 },
    availableFor: "both",
    repeatLimit: 1,
    description: "游戏最大费用上限提升至 12 点。",
    effect: { type: "setManaCap", amount: 12 }
  }
];

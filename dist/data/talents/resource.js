export const RESOURCE_TALENTS = [
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
        id: "mana_favor",
        name: "法力眷顾",
        category: "resource",
        pricing: { first: 4, second: 1 },
        availableFor: "both",
        repeatLimit: 1,
        description: "初始法力上限 +1。",
        effect: { type: "bonusMana", amount: 1 }
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
        pricing: { first: 4, second: 2 },
        availableFor: "both",
        repeatLimit: 1,
        description: "费用高于 6 的使魔法力消耗 -1。",
        effect: { type: "reduceHighCostMinionCost", threshold: 6, amount: 1 }
    }
];

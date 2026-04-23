export const COMBAT_TALENTS = [
    {
        id: "swift_hatch",
        name: "迅捷孵化",
        category: "combat",
        pricing: { first: 5, second: 3 },
        availableFor: "both",
        repeatLimit: 1,
        description: "费用不高于 2 的使魔获得冲锋。",
        effect: { type: "giveRushToLowCostMinions", maxCost: 2 }
    },
    {
        id: "lone_sentinel",
        name: "孤阵哨兵",
        category: "combat",
        pricing: { first: 2, second: 3 },
        availableFor: "both",
        repeatLimit: 1,
        description: "当你场上只有 1 个使魔时，该使魔视为具有守护。",
        effect: { type: "grantLoneMinionGuard" }
    }
];

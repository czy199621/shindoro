export const SURVIVAL_TALENTS = [
    {
        id: "vitality_ritual",
        name: "生命仪式",
        category: "survival",
        pricing: { first: 1, second: 1 },
        availableFor: "both",
        repeatLimit: 1,
        description: "最大生命值 +6。",
        effect: { type: "addMaxHp", amount: 6 }
    },
    {
        id: "desperate_recovery",
        name: "绝境恢复",
        category: "survival",
        pricing: { first: 1, second: 2 },
        availableFor: "both",
        repeatLimit: 1,
        description: "生命值不高于 5 时，回合开始恢复 2 点生命。",
        effect: { type: "healOnLowHpTurnStart", threshold: 5, amount: 2 }
    }
];

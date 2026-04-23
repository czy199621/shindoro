export const SPELL_CARDS = [
    {
        id: "burn",
        name: "灼烧",
        cost: 1,
        type: "spell",
        description: "对敌方角色造成 2 点伤害。",
        effects: [{ trigger: "onPlay", action: { type: "damage", target: "enemyHero", amount: 2 } }]
    },
    {
        id: "arc_bolt",
        name: "弧光箭",
        cost: 2,
        type: "spell",
        description: "对敌方攻击力最高的使魔造成 3 点伤害。",
        effects: [{ trigger: "onPlay", action: { type: "damage", target: "strongestEnemyMinion", amount: 3 } }]
    },
    {
        id: "inspiration",
        name: "灵感汲取",
        cost: 2,
        type: "spell",
        description: "抽 2 张牌。",
        effects: [{ trigger: "onPlay", action: { type: "draw", count: 2 } }]
    },
    {
        id: "healing_prayer",
        name: "愈疗祷词",
        cost: 2,
        type: "spell",
        description: "己方角色恢复 4 点生命。",
        effects: [{ trigger: "onPlay", action: { type: "heal", target: "selfHero", amount: 4 } }]
    },
    {
        id: "cinder_storm",
        name: "烬雨",
        cost: 4,
        type: "spell",
        description: "对所有敌方使魔造成 2 点伤害。",
        effects: [{ trigger: "onPlay", action: { type: "damage", target: "allEnemyMinions", amount: 2 } }]
    },
    {
        id: "soul_shatter",
        name: "灵裂",
        cost: 3,
        type: "spell",
        description: "消灭敌方攻击力最高的使魔。",
        effects: [{ trigger: "onPlay", action: { type: "destroy", target: "strongestEnemyMinion" } }]
    },
    {
        id: "tactics_scroll",
        name: "兵略卷轴",
        cost: 2,
        type: "spell",
        description: "己方使魔获得 +1/+1。",
        effects: [{ trigger: "onPlay", action: { type: "buff", target: "allFriendlyMinions", atk: 1, hp: 1 } }]
    },
    {
        id: "tactical_insight",
        name: "战术洞见",
        cost: 1,
        type: "spell",
        description: "抽 1 张牌。跳脸槽 +1。",
        effects: [
            { trigger: "onPlay", action: { type: "draw", count: 1 } },
            { trigger: "onPlay", action: { type: "addSlot", slot: "jump", amount: 1 } }
        ]
    },
    {
        id: "desperate_gamble",
        name: "孤注一掷",
        cost: 1,
        type: "spell",
        description: "抽 1 张牌。神抽槽 +1。",
        effects: [
            { trigger: "onPlay", action: { type: "draw", count: 1 } },
            { trigger: "onPlay", action: { type: "addSlot", slot: "godDraw", amount: 1 } }
        ]
    },
    {
        id: "coin",
        name: "硬币",
        cost: 0,
        type: "spell",
        description: "本回合获得 1 点法力。",
        effects: [{ trigger: "onPlay", action: { type: "gainMana", amount: 1 } }]
    },
    {
        id: "divine_intervention",
        name: "神意介入",
        cost: 4,
        type: "spell",
        description: "己方角色恢复 6 点生命，并抽 1 张牌。",
        effects: [
            { trigger: "onPlay", action: { type: "heal", target: "selfHero", amount: 6 } },
            { trigger: "onPlay", action: { type: "draw", count: 1 } }
        ]
    },
    {
        id: "judgment_beam",
        name: "审判光束",
        cost: 5,
        type: "spell",
        description: "对所有敌方使魔造成 3 点伤害，并对敌方角色造成 3 点伤害。",
        effects: [
            { trigger: "onPlay", action: { type: "damage", target: "allEnemyMinions", amount: 3 } },
            { trigger: "onPlay", action: { type: "damage", target: "enemyHero", amount: 3 } }
        ]
    }
];

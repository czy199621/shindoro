export const MID_COST_MINIONS = [
    {
        id: "blade_dancer",
        name: "刃舞者",
        cost: 3,
        type: "minion",
        attack: 3,
        health: 3,
        threat: 4,
        description: "战吼：跳脸槽 +1。",
        effects: [{ trigger: "onPlay", action: { type: "addSlot", slot: "jump", amount: 1 } }]
    },
    {
        id: "archivist_owl",
        name: "典籍猫头鹰",
        cost: 3,
        type: "minion",
        attack: 2,
        health: 3,
        threat: 3,
        description: "战吼：抽 1 张牌。",
        effects: [{ trigger: "onPlay", action: { type: "draw", count: 1 } }]
    },
    {
        id: "dusk_assassin",
        name: "薄暮刺客",
        cost: 3,
        type: "minion",
        attack: 3,
        health: 2,
        threat: 4,
        description: "战吼：对敌方攻击力最高的使魔造成 2 点伤害。",
        effects: [{ trigger: "onPlay", action: { type: "damage", target: "strongestEnemyMinion", amount: 2 } }]
    },
    {
        id: "battlefield_bard",
        name: "战歌诗人",
        cost: 3,
        type: "minion",
        attack: 2,
        health: 4,
        threat: 4,
        description: "战吼：己方其他使魔获得 +1 攻击力。",
        effects: [{ trigger: "onPlay", action: { type: "buff", target: "allFriendlyMinionsExceptSource", atk: 1 } }]
    },
    {
        id: "storm_lancer",
        name: "暴风枪骑",
        cost: 4,
        type: "minion",
        attack: 4,
        health: 4,
        threat: 6,
        description: "冲锋。",
        tags: ["rush"],
        effects: []
    },
    {
        id: "mirror_sage",
        name: "镜界贤者",
        cost: 4,
        type: "minion",
        attack: 3,
        health: 5,
        threat: 5,
        description: "亡语：抽 1 张牌。",
        effects: [{ trigger: "onDeath", action: { type: "draw", count: 1 } }]
    },
    {
        id: "pact_weaver",
        name: "契约织手",
        cost: 4,
        type: "minion",
        attack: 3,
        health: 4,
        threat: 5,
        description: "战吼：神抽槽 +1，抽 1 张牌。",
        effects: [
            { trigger: "onPlay", action: { type: "addSlot", slot: "godDraw", amount: 1 } },
            { trigger: "onPlay", action: { type: "draw", count: 1 } }
        ]
    },
    {
        id: "ashen_ranger",
        name: "灰烬游侠",
        cost: 4,
        type: "minion",
        attack: 4,
        health: 3,
        threat: 5,
        description: "战吼：对敌方角色造成 2 点伤害。",
        effects: [{ trigger: "onPlay", action: { type: "damage", target: "enemyHero", amount: 2 } }]
    }
];

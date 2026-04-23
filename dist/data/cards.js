export const CARD_LIBRARY = [
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
        id: "dawn_healer",
        name: "拂晓医者",
        cost: 2,
        type: "minion",
        attack: 2,
        health: 2,
        threat: 3,
        description: "战吼：己方角色恢复 3 点生命。",
        effects: [{ trigger: "onPlay", action: { type: "heal", target: "selfHero", amount: 3 } }]
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
    },
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
    },
    {
        id: "mirror_wall",
        name: "镜像之墙",
        cost: 2,
        type: "trap",
        description: "触发：当敌方施放法术后，对敌方角色造成 3 点伤害。",
        effects: [
            {
                trigger: "onTriggerMet",
                condition: { type: "enemyCastsSpell" },
                action: { type: "damage", target: "enemyHero", amount: 3 }
            }
        ]
    },
    {
        id: "ambush_sigil",
        name: "伏击印记",
        cost: 2,
        type: "trap",
        description: "触发：当敌方召唤使魔后，对该使魔造成 2 点伤害。",
        effects: [
            {
                trigger: "onTriggerMet",
                condition: { type: "enemySummonsMinion" },
                action: { type: "damage", target: "triggeredMinion", amount: 2 }
            }
        ]
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
export const CARD_LOOKUP = Object.fromEntries(CARD_LIBRARY.map((card) => [card.id, card]));
export function getCardDefinition(cardId) {
    const card = CARD_LOOKUP[cardId];
    if (!card) {
        throw new Error(`Unknown card id: ${cardId}`);
    }
    return card;
}

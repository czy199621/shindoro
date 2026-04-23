export const CHARACTERS = [
    {
        id: "character_a",
        name: "角色 A · 炽刃神子",
        title: "节奏压制",
        baseHp: 20,
        talentPoints: 5,
        description: "靠频繁跳脸积累与前中期持续施压滚起雪球。",
        passive: {
            key: "bonusJumpOnGain",
            name: "跃势增幅",
            description: "你增加跳脸槽时，额外获得 1 点。"
        },
        slotAbilities: {
            jump10: {
                name: "烈纹突进",
                description: "对敌方角色造成 2 点伤害，己方使魔获得 +1 攻击力。",
                effects: [
                    { type: "damage", target: "enemyHero", amount: 2 },
                    { type: "buff", target: "allFriendlyMinions", atk: 1 }
                ]
            },
            jump13: {
                name: "霸域破阵",
                description: "对敌方角色造成 4 点伤害，己方使魔获得 +2/+1。",
                effects: [
                    { type: "damage", target: "enemyHero", amount: 4 },
                    { type: "buff", target: "allFriendlyMinions", atk: 2, hp: 1 }
                ]
            }
        }
    },
    {
        id: "character_b",
        name: "角色 B · 返镜巫女",
        title: "防守反击",
        baseHp: 20,
        talentPoints: 4,
        description: "利用神抽槽与清场能力拖进后期，以稳换狠。",
        passive: {
            key: "smallDisadvantageCountsAsMedium",
            name: "逆势映照",
            description: "若本回合仅获得 1 点神抽槽，则改为获得 2 点，且对手不获得对应的 1 点跳脸槽。"
        },
        slotAbilities: {
            jump10: {
                name: "镜裁",
                description: "对所有敌方使魔造成 2 点伤害。",
                effects: [{ type: "damage", target: "allEnemyMinions", amount: 2 }]
            },
            jump13: {
                name: "终镜庇护",
                description: "对所有敌方使魔造成 4 点伤害，己方角色恢复 4 点生命。",
                effects: [
                    { type: "damage", target: "allEnemyMinions", amount: 4 },
                    { type: "heal", target: "selfHero", amount: 4 }
                ]
            }
        }
    },
    {
        id: "character_c",
        name: "角色 C · 断章猎王",
        title: "前期 Rush",
        baseHp: 20,
        talentPoints: 7,
        description: "用更高开局资源压节奏，但每回合都会失去 1 点跳脸槽。",
        passive: {
            key: "loseJumpAtTurnStart",
            name: "躁猎本能",
            description: "你的回合开始时，失去 1 点跳脸槽。"
        },
        slotAbilities: {
            jump10: {
                name: "血驰",
                description: "召唤 1 只余烬狼，己方使魔获得 +1 攻击力。",
                effects: [
                    { type: "summon", cardId: "ember_wolf", count: 1 },
                    { type: "buff", target: "allFriendlyMinions", atk: 1 }
                ]
            },
            jump13: {
                name: "巅猎突袭",
                description: "对敌方角色造成 5 点伤害，并召唤 2 只余烬狼。",
                effects: [
                    { type: "damage", target: "enemyHero", amount: 5 },
                    { type: "summon", cardId: "ember_wolf", count: 2 }
                ]
            }
        }
    }
];
export const CHARACTER_LOOKUP = Object.fromEntries(CHARACTERS.map((character) => [character.id, character]));

export const CHARACTER_D_PASSIVE = {
    key: "loseHpAtTurnStart",
    name: "自损体魄",
    description: "每回合开始时，自身失去 1 点生命。"
};
export const CHARACTER_D_SLOT_ABILITIES = {
    jump10: {
        name: "残血收束",
        description: "除掉敌方关键使魔，并按其剩余生命对敌方英雄造成伤害。",
        effects: [{ type: "exilePriorityEnemyMinionAndDamageHero", damageHeroBy: "health" }]
    },
    jump13: {
        name: "数值收束",
        description: "除掉敌方关键使魔，并按其攻击与生命总和结算伤害。",
        effects: [{ type: "exilePriorityEnemyMinionAndDamageHero", damageHeroBy: "attackAndHealth" }]
    }
};
export const CHARACTER_D = {
    id: "character_d",
    name: "孔德人",
    title: "献祭斩杀者",
    baseHp: 20,
    talentPoints: 6,
    description: "通过处理高价值使魔把场面优势直接转成斩杀伤害。",
    passive: CHARACTER_D_PASSIVE,
    slotAbilities: CHARACTER_D_SLOT_ABILITIES
};

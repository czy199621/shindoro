export const CHARACTER_A_PASSIVE = {
    key: "bonusJumpOnGain",
    name: "跳脸增幅",
    description: "每次增加跳脸槽时，额外再获得 1 点。"
};
export const CHARACTER_A_SLOT_ABILITIES = {
    jump10: {
        name: "定点爆破",
        description: "抓牌阶段后，对敌方核心目标造成 6 点伤害。",
        effects: [{ type: "damage", target: "enemyHero", amount: 6 }]
    },
    jump13: {
        name: "极限爆破",
        description: "强制造成 9 点爆发伤害。",
        effects: [{ type: "damage", target: "enemyHero", amount: 9 }]
    }
};
export const CHARACTER_A = {
    id: "character_a",
    name: "钱陈飞扬",
    title: "爆发操盘手",
    baseHp: 20,
    talentPoints: 5,
    description: "以跳脸槽滚雪球的爆发型角色，适合主动抢节奏。",
    passive: CHARACTER_A_PASSIVE,
    slotAbilities: CHARACTER_A_SLOT_ABILITIES
};

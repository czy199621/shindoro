export const CHARACTER_B_PASSIVE = {
    key: "extraGodDrawOnDisadvantage",
    name: "逆境补偿",
    description: "被判定为劣势、增加神抽槽时，额外再获得 2 点。"
};
export const CHARACTER_B_SLOT_ABILITIES = {
    jump10: {
        name: "补牌急转",
        description: "抓牌阶段结束后，再抓 2 张牌。",
        effects: [{ type: "draw", count: 2 }]
    },
    jump13: {
        name: "逆风检索",
        description: "从牌库上方大量补充资源，保留最关键的手牌。",
        effects: [{ type: "draw", count: 3 }]
    }
};
export const CHARACTER_B = {
    id: "character_b",
    name: "Kapipara",
    title: "逆风资源手",
    baseHp: 20,
    talentPoints: 4,
    description: "擅长在劣势时堆高神抽槽，通过额外抓牌反打。",
    passive: CHARACTER_B_PASSIVE,
    slotAbilities: CHARACTER_B_SLOT_ABILITIES
};

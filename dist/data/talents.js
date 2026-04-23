export const TALENTS = [
    {
        id: "vitality_ritual",
        name: "生命仪式",
        category: "hpBoost",
        cost: 2,
        repeatLimit: 1,
        description: "开局最大生命值 +4。",
        effect: { type: "addMaxHp", amount: 4 }
    },
    {
        id: "wide_grip",
        name: "广识之手",
        category: "handLimit",
        cost: 1,
        repeatLimit: 2,
        description: "手牌上限 +2。",
        effect: { type: "addHandLimit", amount: 2 }
    },
    {
        id: "foretold_scroll",
        name: "预示卷轴",
        category: "topDeckSetup",
        cost: 1,
        repeatLimit: 1,
        description: "开局时将牌库中最低费法术置于牌库顶。",
        effect: { type: "setTopDeckByRule", rule: "lowestCostSpell" }
    },
    {
        id: "jump_drive",
        name: "跳脸调律",
        category: "slotAcceleration",
        cost: 2,
        repeatLimit: 1,
        description: "你获得跳脸槽时额外 +1。",
        effect: { type: "modifySlotGain", slot: "jump", amount: 1 }
    },
    {
        id: "god_drive",
        name: "神抽调律",
        category: "slotAcceleration",
        cost: 2,
        repeatLimit: 1,
        description: "你获得神抽槽时额外 +1。",
        effect: { type: "modifySlotGain", slot: "godDraw", amount: 1 }
    },
    {
        id: "opening_insight",
        name: "先见一页",
        category: "manaOrDraw",
        cost: 1,
        repeatLimit: 1,
        description: "起手额外抽 1 张牌。",
        effect: { type: "bonusDraw", amount: 1 }
    },
    {
        id: "mana_favor",
        name: "玛那眷顾",
        category: "manaOrDraw",
        cost: 2,
        repeatLimit: 1,
        description: "初始法力上限 +1。",
        effect: { type: "bonusMana", amount: 1 }
    }
];
export const TALENT_LOOKUP = Object.fromEntries(TALENTS.map((talent) => [talent.id, talent]));
